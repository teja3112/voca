import { useEffect, useRef, useState } from "react"
import { getPrefs } from "../lib/storage"
import type { Screen, Topic } from "../lib/types"

interface Props {
  topic: Topic | null
  onNavigate: (screen: Screen) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#4ADE80",
  intermediate: "#FFB21A",
  advanced: "#F87171",
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function Preparation({ topic, onNavigate }: Props) {
  const prefs = getPrefs()
  const prepSeconds = Math.max(
    1,
    Math.round((prefs.preparationTime || 10) * 60),
  )

  const [secondsLeft, setSecondsLeft] = useState(prepSeconds)
  const deadlineRef = useRef<number>(Date.now() + prepSeconds * 1000)
  const navigatedRef = useRef(false)

  // Redirect to setup if this screen is reached without a topic (e.g. a
  // direct refresh) — done in an effect, not during render, since
  // navigation is a side effect and calling the parent's setState while
  // this component is rendering is not allowed by React.
  // If missing topic, show error state
  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090909]">
        <p className="text-xl text-red-400 mb-6 font-semibold">Practice session could not be restored.</p>
        <button
          onClick={() => onNavigate("topic-selection")}
          className="px-8 py-3 rounded-xl font-bold bg-white text-black"
        >
          Start New Practice
        </button>
      </div>
    )
  }

  // Timestamp-anchored countdown: recomputes remaining time from a fixed
  // deadline every tick, rather than decrementing a counter. A plain
  // `setInterval(() => setTime(t => t - 1), 1000)` drifts under browser
  // throttling (e.g. a backgrounded tab) — this self-corrects regardless
  // of how late any individual tick fires.
  useEffect(() => {
    if (!topic) return

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((deadlineRef.current - Date.now()) / 1000),
      )
      setSecondsLeft(remaining)
      if (remaining <= 0 && !navigatedRef.current) {
        navigatedRef.current = true
        onNavigate("speaking")
      }
    }

    tick() // sync immediately in case of a re-mount mid-countdown
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [topic, onNavigate])

  if (!topic) {
    return null
  }

  const progress = ((prepSeconds - secondsLeft) / prepSeconds) * 100
  const circumference = 2 * Math.PI * 118
  const strokeDash = circumference - (progress / 100) * circumference
  const almostDone = secondsLeft <= 10

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ background: "#090909" }}
    >
      <div className="w-full text-center" style={{ maxWidth: 720 }}>
        {/* Back */}
        <button
          onClick={() => onNavigate("topic-selection")}
          className="inline-flex items-center gap-1.5 mb-10 transition-colors duration-200"
          style={{ color: "#555", fontSize: "1rem" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#888")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#555")
          }
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <p
            className="font-semibold uppercase tracking-widest mb-4"
            style={{
              color: "#FFB21A",
              letterSpacing: "0.14em",
              fontSize: "0.9rem",
            }}
          >
            Your Challenge
          </p>
          <h1
            className="font-bold mb-6"
            style={{
              fontSize: "clamp(2rem, 5.5vw, 2.75rem)",
              letterSpacing: "-0.02em",
              color: "#F0F0F0",
              lineHeight: 1.25,
            }}
          >
            {topic.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span
              className="font-bold uppercase tracking-wider rounded-full"
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
            <span
              className="font-bold uppercase tracking-wider rounded-full"
              style={{
                fontSize: "0.9rem",
                padding: "8px 18px",
                background: "rgba(255,178,26,0.06)",
                color: "#FFB21A",
                letterSpacing: "0.06em",
              }}
            >
              {prefs.preparationTime} Min Preparation
            </span>
            <span
              className="font-bold uppercase tracking-wider rounded-full"
              style={{
                fontSize: "0.9rem",
                padding: "8px 18px",
                background: "rgba(255,255,255,0.05)",
                color: "#AAA",
                letterSpacing: "0.06em",
              }}
            >
              {prefs.speakingTime} Min Speaking
            </span>
          </div>
        </div>

        {/* Topic Guidance */}
        <div
          className="mb-10 mx-auto animate-fade-in delay-100 flex flex-col gap-6 text-left"
          style={{ maxWidth: 440 }}
        >
          {/* Think About */}
          <div
            className="rounded-2xl"
            style={{
              padding: "24px 28px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#555", letterSpacing: "0.1em", fontSize: "0.82rem" }}
            >
              Think about
            </p>
            <div className="space-y-3">
              {topic.thinkAbout.map((prompt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span style={{ color: "#FFB21A", fontSize: "1rem", lineHeight: 1.5 }}>•</span>
                  <p style={{ color: "#C0C0C0", fontSize: "1.05rem", lineHeight: 1.5 }}>
                    {prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Try to Include */}
          <div
            className="rounded-2xl"
            style={{
              padding: "24px 28px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#555", letterSpacing: "0.1em", fontSize: "0.82rem" }}
            >
              Try to Include
            </p>
            <div className="space-y-3">
              {topic.include.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span style={{ color: "#FFB21A", fontSize: "1rem", lineHeight: 1.5 }}>•</span>
                  <p style={{ color: "#C0C0C0", fontSize: "1.05rem", lineHeight: 1.5 }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center mb-10 animate-fade-in delay-200">
          <div className="relative" style={{ width: 264, height: 264 }}>
            <svg
              width="264"
              height="264"
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
                stroke={almostDone ? "#F87171" : "#FFB21A"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDash}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-bold"
                style={{
                  fontSize: "clamp(3rem, 9vw, 3.75rem)",
                  color: almostDone ? "#F87171" : "#F0F0F0",
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>
          <p className="mt-5" style={{ color: "#888", fontSize: "1rem" }}>
            {almostDone
              ? "Almost time to speak..."
              : "Organize your thoughts before you start."}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => onNavigate("speaking")}
          className="w-full mx-auto flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 animate-fade-in delay-300"
          style={{
            maxWidth: 340,
            padding: "18px 0",
            background: "#FFB21A",
            color: "#0D0D0D",
            fontSize: "1.1rem",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#FFC33A")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#FFB21A")
          }
        >
          Start Speaking Now
          <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
