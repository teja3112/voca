import { useCallback, useEffect, useRef, useState } from "react"
import type { Screen, Topic } from "../lib/types"
import { getPrefs } from "../lib/storage"

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvt) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvt {
  error: string
}

declare const SpeechRecognition: {
  new (): SpeechRecognition
}

interface Props {
  topic: Topic | null
  onNavigate: (screen: Screen) => void
  onFinish: (transcript: string, duration: number) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#4ADE80",
  intermediate: "#FFB21A",
  advanced: "#F87171",
}

function WaveformCanvas({
  analyser,
  isRecording,
}: {
  analyser: AnalyserNode | null
  isRecording: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let lastW = 0
    let lastH = 0

    function draw() {
      if (!canvas || !ctx) return

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      // Only reallocate the backing store when the on-screen size
      // actually changes — resetting canvas.width/height every frame
      // (60x/sec) forces a full reallocation and is needless work.
      if (w !== lastW || h !== lastH) {
        canvas.width = w * window.devicePixelRatio
        canvas.height = h * window.devicePixelRatio
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        lastW = w
        lastH = h
      }

      ctx.clearRect(0, 0, w, h)

      if (analyser && isRecording) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(dataArray)

        const barCount = 48
        const step = Math.floor(bufferLength / barCount)
        const barW = (w / barCount) * 0.4
        const gap = w / barCount

        for (let i = 0; i < barCount; i++) {
          const sample = dataArray[i * step] / 128 - 1
          const barH = Math.max(3, Math.abs(sample) * h * 0.85 + 3)
          const x = i * gap + gap / 2 - barW / 2
          const y = h / 2 - barH / 2

          const alpha = 0.4 + Math.abs(sample) * 0.6
          ctx.fillStyle = `rgba(255, 178, 26, ${alpha})`
          ctx.beginPath()
          ctx.roundRect(x, y, barW, barH, 2)
          ctx.fill()
        }
      } else {
        // Idle animation
        const barCount = 48
        const barW = (w / barCount) * 0.4
        const gap = w / barCount
        const t = Date.now() / 1000

        for (let i = 0; i < barCount; i++) {
          const phase = (i / barCount) * Math.PI * 4 + t * 2
          const amp = (Math.sin(phase) * 0.5 + 0.5) * 0.15 + 0.05
          const barH = amp * 60 + 3
          const x = i * gap + gap / 2 - barW / 2
          const y = h / 2 - barH / 2
          ctx.fillStyle = "rgba(255,178,26,0.15)"
          ctx.beginPath()
          ctx.roundRect(x, y, barW, barH, 2)
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [analyser, isRecording])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  )
}

export default function Speaking({ topic, onNavigate, onFinish }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finalTranscriptRef = useRef("")

  // Timestamp-anchored elapsed time: `accumulatedRef` banks whole seconds
  // from prior (pre-pause) segments, `startTimeRef` marks when the
  // current segment began. Elapsed is recomputed from these on every
  // tick, so an individual tick firing late (throttled tab, slow device)
  // never causes drift — unlike a plain `setInterval(() => t+1, 1000)`.
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)

  // recognition.onend is bound once per SpeechRecognition instance and
  // would otherwise always see whatever isRecording/isPaused were at the
  // moment it was created (a classic stale closure) — reading a ref that
  // start/pause/stop update directly avoids that.
  const shouldListenRef = useRef(false)
  // Guards against handleStop running twice (e.g. the auto-finish effect
  // firing in the same tick as a manual "Finish Speaking" click).
  const hasFinishedRef = useRef(false)

  const startMic = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 1024
      source.connect(analyserNode)
      setAnalyser(analyserNode)
      return true
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Microphone access was denied. Please allow microphone access in your browser's site settings, then try again.",
        )
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No microphone was found. Please connect one and try again.")
      } else {
        setError(
          "Couldn't access your microphone. Please check your device and try again.",
        )
      }
      return false
    }
  }, [])

  const startSpeech = useCallback((): boolean => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError(
        "Speech recognition isn't supported in this browser. Please use Chrome or Edge.",
      )
      return false
    }

    // Defensive: never let a stray prior instance keep running if this
    // somehow gets called twice (e.g. a rapid double-click).
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let interim = ""
      let final = finalTranscriptRef.current
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + " "
        } else {
          interim += result[0].transcript
        }
      }
      finalTranscriptRef.current = final
      setTranscript(final + interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvt) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    // Some browsers force-stop recognition after a period of silence, or
    // after a fixed max duration, even with continuous=true. Reading the
    // ref (not component state) here means this always reflects current
    // intent rather than the values captured when the handler was bound.
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          // Already starting/started elsewhere — safe to ignore.
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      return true
    } catch {
      setError("Couldn't start speech recognition. Please try again.")
      return false
    }
  }, [])

  const startTicking = useCallback(() => {
    startTimeRef.current = Date.now()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const activeSeconds =
        startTimeRef.current !== null
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0
      setElapsed(accumulatedRef.current + activeSeconds)
    }, 250)
  }, [])

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (startTimeRef.current !== null) {
      accumulatedRef.current += Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      )
      startTimeRef.current = null
    }
  }, [])

  // Guards against a rapid double-click firing handleStart twice while
  // the first call is still awaiting mic permission.
  const isStartingRef = useRef(false)

  async function handleStart() {
    if (isStartingRef.current) return
    isStartingRef.current = true
    setIsStarting(true)
    setError(null)
    try {
      const micOk = await startMic()
      // Never show a "Recording" state, start the timer, or touch speech
      // recognition if the microphone wasn't actually acquired.
      if (!micOk) return

      const speechOk = startSpeech()
      if (!speechOk) {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        audioContextRef.current?.close()
        streamRef.current = null
        audioContextRef.current = null
        setAnalyser(null)
        return
      }

      hasFinishedRef.current = false
      shouldListenRef.current = true
      accumulatedRef.current = 0
      finalTranscriptRef.current = ""
      setTranscript("")
      setElapsed(0)
      setIsRecording(true)
      setIsPaused(false)
      startTicking()
    } finally {
      isStartingRef.current = false
      setIsStarting(false)
    }
  }

  function handlePause() {
    if (isPaused) {
      shouldListenRef.current = true
      try {
        recognitionRef.current?.start()
      } catch {
        // Already running — fine.
      }
      startTicking()
      setIsPaused(false)
    } else {
      shouldListenRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {
        // Already stopped — fine.
      }
      stopTicking()
      setIsPaused(true)
    }
  }

  async function handleStop() {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true
    setIsFinishing(true)

    shouldListenRef.current = false
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      }
    } catch {
      /* ignore */
    }
    stopTicking()
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try { t.stop() } catch {}
      })
      streamRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try { audioContextRef.current.close() } catch {}
      audioContextRef.current = null
    }
    
    setAnalyser(null)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const finalResult = (finalTranscriptRef.current || transcript).trim()
    if (!finalResult) {
      setError("We couldn't detect any speech. Please try speaking clearly into the microphone.")
      setIsFinishing(false)
      setIsRecording(false)
      return
    }
    
    onFinish(finalResult, elapsed)
  }

  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {
        /* ignore */
      }
      if (intervalRef.current) clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  // Redirect if this screen is reached without a topic (e.g. a direct
  // refresh) — in an effect, since navigating is a side effect and
  // calling the parent's setState during this component's render is not
  // allowed by React.
  useEffect(() => {
    if (!topic) {
      onNavigate("topic-selection")
    }
  }, [topic, onNavigate])

  const targetSeconds = (() => {
    const prefs = getPrefs()
    return (prefs.speakingTime || 2) * 60
  })()

  // Auto-finish the moment the speaking countdown reaches zero.
  useEffect(() => {
    if (isRecording && !isPaused && elapsed >= targetSeconds) {
      handleStop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, isRecording, isPaused, targetSeconds])

  if (!topic) {
    return null
  }

  const remainingSeconds = Math.max(0, targetSeconds - elapsed)
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0")
  const seconds = String(remainingSeconds % 60).padStart(2, "0")
  const almostDone = remainingSeconds <= 10
  const targetMin = String(Math.floor(targetSeconds / 60)).padStart(2, "0")
  const targetSec = String(targetSeconds % 60).padStart(2, "0")
  const progress = ((targetSeconds - remainingSeconds) / targetSeconds) * 100
  const circumference = 2 * Math.PI * 118
  const strokeDash = circumference - (progress / 100) * circumference

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "#090909" }}
    >
      <div className="w-full" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <p
            className="font-semibold uppercase tracking-widest mb-4"
            style={{
              color: "#FFB21A",
              letterSpacing: "0.14em",
              fontSize: "0.9rem",
            }}
          >
            Your Topic
          </p>
          <h1
            className="font-bold mb-5"
            style={{
              fontSize: "clamp(1.6rem, 4.5vw, 2rem)",
              letterSpacing: "-0.02em",
              color: "#F0F0F0",
              lineHeight: 1.3,
            }}
          >
            {topic.title}
          </h1>
          <span
            className="inline-block font-bold uppercase tracking-wider rounded-full"
            style={{
              fontSize: "0.9rem",
              padding: "8px 18px",
              background: `${DIFFICULTY_COLORS[topic.difficulty]}18`,
              color: DIFFICULTY_COLORS[topic.difficulty],
              letterSpacing: "0.06em",
            }}
          >
            {topic.difficulty.charAt(0).toUpperCase() +
              topic.difficulty.slice(1)}
          </span>
        </div>

        {/* Mic / countdown */}
        <div className="flex flex-col items-center mb-10 animate-fade-in delay-100">
          {!isRecording ? (
            error ? (
              <div className="flex flex-col items-center w-full animate-fade-in">
                <p className="font-bold mb-4" style={{ color: "#F0F0F0", fontSize: "1.4rem" }}>
                  Oops!
                </p>
                <p className="mb-8 max-w-sm mx-auto text-center" style={{ color: "#F87171", fontSize: "1.05rem", lineHeight: 1.5 }}>
                  {error}
                </p>
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={() => onNavigate("preparation")}
                    className="rounded-xl font-medium transition-colors"
                    style={{
                      padding: "14px 32px",
                      background: "rgba(255,255,255,0.06)",
                      color: "#AAA",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStart}
                    className="rounded-xl font-semibold transition-colors"
                    style={{
                      padding: "14px 32px",
                      background: "#FFB21A",
                      color: "#0D0D0D",
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
            <>
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="relative rounded-full flex items-center justify-center transition-all duration-300 mb-7 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ width: 120, height: 120, background: "#FFB21A" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)")
                }
              >
                <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
                  <rect x="11" y="3" width="10" height="17" rx="5" fill="#0D0D0D" />
                  <path d="M6 16a10 10 0 0 0 20 0" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="16" y1="26" x2="16" y2="29" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              <p className="font-bold mb-2" style={{ color: "#F0F0F0", fontSize: "1.4rem" }}>
                {isStarting ? "Preparing..." : "Ready to speak."}
              </p>
              <p style={{ color: "#777", fontSize: "1.05rem" }}>
                {isStarting
                  ? "Requesting microphone access"
                  : `You'll have ${targetMin}:${targetSec} — tap the mic to begin`}
              </p>
            </>
            )
          ) : (
            <>
              <div className="relative" style={{ width: 240, height: 240 }}>
                <svg
                  width="240"
                  height="240"
                  className="-rotate-90"
                  viewBox="0 0 264 264"
                >
                  <circle
                    cx="132"
                    cy="132"
                    r="118"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="132"
                    cy="132"
                    r="118"
                    fill="none"
                    stroke={
                      almostDone ? "#F87171" : isPaused ? "#444" : "#FFB21A"
                    }
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDash}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-bold"
                    style={{
                      fontSize: "3.2rem",
                      letterSpacing: "-0.03em",
                      fontVariantNumeric: "tabular-nums",
                      color: almostDone ? "#F87171" : "#F0F0F0",
                    }}
                  >
                    {minutes}:{seconds}
                  </span>
                </div>
              </div>
              <p
                className="font-bold uppercase tracking-widest mt-5"
                style={{
                  color: isFinishing ? "#444" : isPaused ? "#555" : "#FFB21A",
                  letterSpacing: "0.1em",
                  fontSize: "0.95rem",
                }}
              >
                {isFinishing ? "Finishing..." : isPaused ? "Paused" : "You're speaking..."}
              </p>
            </>
          )}
        </div>

        {/* Waveform */}
        <div
          className="w-full h-20 rounded-xl mb-8 overflow-hidden animate-fade-in delay-200"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <WaveformCanvas
            analyser={analyser}
            isRecording={isRecording && !isPaused && !isFinishing}
          />
        </div>

        {/* Live transcript preview */}
        {isRecording && transcript && (
          <div
            className="p-4 rounded-xl mb-6 animate-fade-in"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "#444", letterSpacing: "0.1em" }}
            >
              Transcript
            </p>
            <p
              className="leading-relaxed line-clamp-3"
              style={{ color: "#888", fontSize: "0.85rem" }}
            >
              {transcript}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <p style={{ color: "#F87171", fontSize: "0.85rem" }}>{error}</p>
          </div>
        )}

        {/* Controls */}
        {isRecording && (
          <div className="flex gap-3 animate-fade-in">
            <button
              onClick={handlePause}
              className="flex-1 rounded-xl font-medium transition-all duration-200"
              style={{
                padding: "16px 0",
                fontSize: "1rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#999",
              }}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 rounded-xl font-semibold transition-all duration-200"
              style={{
                padding: "16px 0",
                fontSize: "1rem",
                background: isFinishing ? "#888" : "#FFB21A",
                color: "#0D0D0D",
                cursor: isFinishing ? "not-allowed" : "pointer",
              }}
              disabled={isFinishing}
            >
              {isFinishing ? "Finishing..." : "Finish Speaking"}
            </button>
          </div>
        )}

        {/* Cancel */}
        {!isRecording && (
          <div className="flex justify-center animate-fade-in delay-300">
            <button
              onClick={() => onNavigate("preparation")}
              className="transition-colors duration-200"
              style={{ color: "#555", fontSize: "0.95rem" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#888")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#555")
              }
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
