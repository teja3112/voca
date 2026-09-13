import { useCallback, useEffect, useRef, useState, useMemo } from "react"

// ---- Phase timing model ----
// Phase 1: short pause before any motion.
// Phase 2: accelerate from a slow start up to full speed (ease-in).
// Phase 3: sustained fast spin.
// Phase 4: decelerate back down (ease-out) toward the lock.
const PAUSE_MS = 100
const SPIN_TOTAL_MS = 3800

/** Interval (ms) to the next tick, given elapsed time since spinning began. */
function intervalAt(elapsed: number): number {
  if (elapsed < 700) return 50 // very fast
  if (elapsed < 1600) return 100 // fast
  if (elapsed < 2400) return 200 // medium
  if (elapsed < 3200) return 400 // slow
  return 600 // very slow
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

/**
 * Short synced "ticks" during the roll, and a distinct "ding" when the
 * roulette lands. Uses the Web Audio API directly. Silently no-ops if
 * AudioContext is unavailable or blocked by autoplay policy — the visual
 * roulette must keep working regardless, and stops instantly when the
 * roll stops (no continuous or looping sound is ever scheduled).
 */
function useRouletteAudio() {
  const ctxRef = useRef<AudioContext | null>(null)

  const ensureCtx = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtor) return null
      ctxRef.current = new AudioCtor()
      return ctxRef.current
    } catch {
      return null
    }
  }, [])

  const tick = useCallback(
    (progress: number) => {
      const ctx = ensureCtx()
      if (!ctx) return
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "square"
        // Subtle pitch lift as it slows, like a settling mechanical reel.
        const freq = 600 + progress * 220
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.004)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.05)
      } catch {
        // Ignore — ticking sound is a nice-to-have, never blocks the visual.
      }
    },
    [ensureCtx],
  )

  const final = useCallback(() => {
    const ctx = ensureCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(760, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.07)
      osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.16)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.035)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.45)
    } catch {
      // Ignore — same as above.
    }
  }, [ensureCtx])

  const close = useCallback(() => {
    try {
      ctxRef.current?.close()
    } catch {
      // Ignore.
    }
    ctxRef.current = null
  }, [])

  return useMemo(() => ({ tick, final, close }), [tick, final, close])
}

export interface UseTopicRouletteResult {
  /** Text currently shown (cycling decoy, or the final title once landed). */
  display: string
  /** True from the moment `run` is called until it lands (includes the initial pause). */
  rolling: boolean
  /** Bumped on every visual tick — use as a React `key` to replay the CSS animation. */
  tickKey: number
  /** Duration (ms) to use for the current tick's CSS animation, mirroring the audio pace. */
  tickDurationMs: number
  /** Start a roulette run that ends on `finalTitle`. No-ops if already rolling. */
  run: (finalTitle: string, onDone?: () => void) => void
}

/**
 * Drives the "roulette text" reveal: a short pause, then acceleration into
 * a fast spin, then deceleration down to a precise landing on `finalTitle`
 * — which must already be the result of the app's existing topic-selection
 * logic. This hook is purely a visual/audio reveal; it never picks a topic
 * of its own.
 */
export function useTopicRoulette(
  candidateTitles: string[],
): UseTopicRouletteResult {
  const [display, setDisplay] = useState("")
  const [rolling, setRolling] = useState(false)
  const [tickKey, setTickKey] = useState(0)
  const [tickDurationMs, setTickDurationMs] = useState(160)

  const runningRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyNetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audio = useRouletteAudio()

  const stopTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    if (safetyNetRef.current) clearTimeout(safetyNetRef.current)
    safetyNetRef.current = null
    if (onDoneTimerRef.current) clearTimeout(onDoneTimerRef.current)
    onDoneTimerRef.current = null
  }, [])

  const run = useCallback(
    (finalTitle: string, onDone?: () => void) => {
      if (runningRef.current) return

      if (prefersReducedMotion()) {
        setDisplay(finalTitle)
        setRolling(false)
        audio.final()
        onDone?.()
        return
      }

      runningRef.current = true
      setRolling(true)

      const pool = candidateTitles.filter((t) => t !== finalTitle)
      const pick = (exclude: string) => {
        if (pool.length === 0) return finalTitle
        let next = pool[Math.floor(Math.random() * pool.length)]
        if (next === exclude && pool.length > 1) {
          next = pool[Math.floor(Math.random() * pool.length)]
        }
        return next
      }

      let lastText = pick("")
      setDisplay(lastText)
      setTickKey((k) => k + 1)

      timeoutRef.current = setTimeout(() => {
        const spinStart = Date.now()

        const step = () => {
          const now = Date.now()
          const elapsed = now - spinStart

          if (elapsed >= SPIN_TOTAL_MS) {
            setDisplay(finalTitle)
            setTickKey((k) => k + 1)
            setTickDurationMs(340)
            setRolling(false)
            runningRef.current = false
            audio.final()
            onDoneTimerRef.current = setTimeout(() => {
              onDone?.()
            }, 800)
            return
          }

          const next = pick(lastText)
          lastText = next
          const progress = elapsed / SPIN_TOTAL_MS
          const interval = intervalAt(elapsed)

          setDisplay(next)
          setTickKey((k) => k + 1)
          setTickDurationMs(Math.min(interval * 0.7, 260))
          audio.tick(progress)

          timeoutRef.current = setTimeout(step, interval)
        }

        step()
      }, PAUSE_MS)

      // Safety net: forcibly end after absolute max time (SPIN_TOTAL_MS + PAUSE_MS + 1000)
      safetyNetRef.current = setTimeout(
        () => {
          if (runningRef.current) {
            stopTimer()
            setDisplay(finalTitle)
            setTickKey((k) => k + 1)
            setTickDurationMs(340)
            setRolling(false)
            runningRef.current = false
            audio.final()
            onDone?.()
          }
        },
        PAUSE_MS + SPIN_TOTAL_MS + 1000,
      )
    },
    [candidateTitles, audio, stopTimer],
  )

  useEffect(() => {
    return () => {
      stopTimer()
      runningRef.current = false
      audio.close()
    }
  }, [stopTimer, audio])

  return { display, rolling, tickKey, tickDurationMs, run }
}
