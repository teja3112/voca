import { useEffect, useRef, useState } from "react"
import type { AnalysisResult, Session, Topic } from "../lib/types"
import { analyzeTranscript } from "../lib/gemini"
import { getPrefs, saveSession } from "../lib/storage"
import type { Screen } from "../lib/types"

interface Props {
  topic: Topic | null
  transcript: string
  duration: number
  onNavigate: (screen: Screen) => void
  onResults: (session: Session) => void
}

const STAGES = [
  "Speech transcribed",
  "Analyzing fluency",
  "Checking grammar",
  "Evaluating vocabulary",
  "Evaluating confidence",
  "Preparing feedback",
]

const ORBIT_DOTS = 8

function OrbitCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const R = 54
    const cx = 80
    const cy = 80

    function draw() {
      if (!canvas || !ctx) return
      const w = (canvas.width = canvas.height = 160)
      ctx.clearRect(0, 0, w, w)

      const t = Date.now() / 1000

      // Orbit ring
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(255,178,26,0.08)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Orbiting dots
      for (let i = 0; i < ORBIT_DOTS; i++) {
        const angle = (i / ORBIT_DOTS) * Math.PI * 2 + t * 1.2
        const x = cx + Math.cos(angle) * R
        const y = cy + Math.sin(angle) * R
        const alpha = active ? 0.3 + 0.7 * ((i + 1) / ORBIT_DOTS) : 0.1
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,178,26,${alpha})`
        ctx.fill()
      }

      // Center circle
      ctx.beginPath()
      ctx.arc(cx, cy, 28, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,178,26,0.06)"
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, 28, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(255,178,26,0.2)"
      ctx.lineWidth = 1
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  return (
    <canvas ref={canvasRef} width={160} height={160} className="w-40 h-40" />
  )
}

export default function Analyzing({
  topic,
  transcript,
  duration,
  onNavigate,
  onResults,
}: Props) {
  const [currentStage, setCurrentStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const hasRun = useRef(false)
  const isMountedRef = useRef(true)

  async function runAnalysis() {
    setError(null)
    const stageInterval = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(stageInterval)
        return
      }
      setCurrentStage((s) => Math.min(s + 1, STAGES.length - 1))
    }, 900)

    try {
      const prefs = getPrefs()
      const analysis: AnalysisResult = await analyzeTranscript(
        transcript || "(No speech detected)",
        topic?.title ?? "General speaking",
        topic?.difficulty ?? "intermediate",
        prefs.speakingTime * 60, // target in seconds
        duration // actual in seconds
      )
      
      clearInterval(stageInterval)
      if (!isMountedRef.current) return
      setCurrentStage(STAGES.length - 1)

      const session: Session = {
        id: crypto.randomUUID(),
        topicId: topic?.id ?? "",
        topicTitle: topic?.title ?? "General",
        difficulty: topic?.difficulty ?? "intermediate",
        date: new Date().toISOString(),
        score: analysis.overallScore,
        speakingTime: duration,
        topic: topic,
        transcript,
        overallScore: analysis.overallScore,
        scores: analysis.scores,
        analysis,
      }

      saveSession(session)

      setTimeout(() => {
        if (!isMountedRef.current) return
        onResults(session)
        onNavigate("results")
      }, 600)
    } catch (err) {
      clearInterval(stageInterval)
      if (!isMountedRef.current) return
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      )
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    if (!hasRun.current) {
       hasRun.current = true
       runAnalysis()
    }
    return () => {
      isMountedRef.current = false
    }
  }, [])

  function handleApiKeySubmit() {
    if (!apiKeyInput.trim()) return
    localStorage.setItem("voca_gemini_key", apiKeyInput.trim())
    hasRun.current = false
    runAnalysis(apiKeyInput.trim())
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "#090909" }}
    >
      <div className="w-full max-w-sm text-center">
        {error ? (
          <div className="animate-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "#F87171" }}
              >
                <path
                  d="M12 8v5M12 16.5h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2
              className="font-bold mb-3"
              style={{
                fontSize: "1.3rem",
                letterSpacing: "-0.02em",
                color: "#F0F0F0",
              }}
            >
              Analysis failed
            </h2>
            <p
              className="mb-6 leading-relaxed"
              style={{ color: "#666", fontSize: "0.85rem" }}
            >
              {error}
            </p>
            <button
              onClick={() => {
                hasRun.current = false
                runAnalysis()
              }}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: "#FFB21A", color: "#0D0D0D" }}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Orbital animation */}
            <div className="flex justify-center mb-8">
              <OrbitCanvas active />
            </div>

            <h2
              className="font-bold mb-2"
              style={{
                fontSize: "1.5rem",
                letterSpacing: "-0.02em",
                color: "#F0F0F0",
              }}
            >
              Listening to your response.
            </h2>
            <p className="mb-10" style={{ color: "#666", fontSize: "0.9rem" }}>
              We're looking at your language, structure, and how effectively you answered the topic.
            </p>

            {/* Stage list */}
            <div className="space-y-3 text-left">
              {STAGES.map((stage, i) => {
                const done = i < currentStage
                const active = i === currentStage
                return (
                  <div
                    key={stage}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500"
                    style={{
                      background: active
                        ? "rgba(255,178,26,0.07)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(255,178,26,0.15)"
                        : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: done
                          ? "#4ADE80"
                          : active
                            ? "#FFB21A"
                            : "rgba(255,255,255,0.05)",
                      }}
                    >
                      {done ? (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2 2 4-4"
                            stroke="#0D0D0D"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : active ? (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: "#0D0D0D",
                            animation: "pulse-ring 1s ease-in-out infinite",
                          }}
                        />
                      ) : null}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: done ? "#4ADE80" : active ? "#FFB21A" : "#444",
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
