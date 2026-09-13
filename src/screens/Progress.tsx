import { useState } from "react"
import { getSessions, getStats } from "../lib/storage"
import type { Screen, Session } from "../lib/types"

interface Props {
  onNavigate: (screen: Screen) => void
  onViewSession: (session: Session) => void
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const SCORE_LABELS = [
  "fluency",
  "grammar",
  "vocabulary",
  "clarity",
  "relevance",
  "structure",
  "development",
] as const

function SparkChart({ sessions }: { sessions: Session[] }) {
  if (sessions.length < 2) return null

  const scores = sessions
    .slice()
    .reverse()
    .map((s) => s.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const W = 300
  const H = 60
  const pad = 6

  const points = scores.map((score, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2)
    const y = H - pad - ((score - min) / range) * (H - pad * 2)
    return [x, y]
  })

  const path = "M " + points.map(([x, y]) => `${x},${y}`).join(" L ")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 60 }}
      preserveAspectRatio="none"
    >
      {/* Fill */}
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB21A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFB21A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${points[points.length - 1][0]},${H} L ${points[0][0]},${H} Z`}
        fill="url(#scoreGrad)"
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke="#FFB21A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#FFB21A" />
      ))}
    </svg>
  )
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm" style={{ color: "#888" }}>
          {label}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: "#FFB21A" }}
        >
          {value}
        </span>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: "#FFB21A" }}
        />
      </div>
    </div>
  )
}

export default function Progress({ onNavigate, onViewSession }: Props) {
  const sessions = getSessions()
  const stats = getStats()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const avgSkills = SCORE_LABELS.reduce(
    (acc, key) => {
      if (sessions.length === 0) return { ...acc, [key]: 0 }
      acc[key] = Math.round(
        sessions.reduce((s, sess) => s + sess.analysis.scores[key], 0) /
          sessions.length,
      )
      return acc
    },
    {} as Record<string, number>,
  )

  const statItems = [
    {
      label: "Sessions",
      value: String(stats.totalSessions),
      sub: "completed",
    },
    {
      label: "Speaking time",
      value: formatTime(stats.totalSpeakingTime),
      sub: "total",
    },
    {
      label: "Avg. score",
      value: stats.averageScore ? `${stats.averageScore}` : "—",
      sub: "/ 100",
    },
    {
      label: "Streak",
      value: `${stats.currentStreak}`,
      sub: stats.currentStreak === 1 ? "day" : "days",
    },
  ]

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-10"
      style={{ background: "#090909" }}
    >
      <div className="mx-auto" style={{ maxWidth: 780 }}>
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <p
            className="font-semibold uppercase tracking-widest mb-2"
            style={{
              color: "#FFB21A",
              letterSpacing: "0.12em",
              fontSize: "0.85rem",
            }}
          >
            Dashboard
          </p>
          <h1
            className="font-bold"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 2.75rem)",
              letterSpacing: "-0.02em",
              color: "#F0F0F0",
            }}
          >
            Your progress
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-fade-in delay-100">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className="text-xs mb-2"
                style={{ color: "#555", letterSpacing: "0.04em" }}
              >
                {item.label}
              </p>
              <p
                className="font-bold mb-0.5 tabular-nums"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "-0.03em",
                  color: "#FFB21A",
                }}
              >
                {item.value}
              </p>
              <p style={{ color: "#444", fontSize: "0.75rem" }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Score chart */}
        {sessions.length >= 2 && (
          <div
            className="p-6 rounded-2xl mb-5 animate-fade-in delay-200"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#444", letterSpacing: "0.1em" }}
              >
                Score over time
              </p>
              <span style={{ color: "#555", fontSize: "0.75rem" }}>
                Last {Math.min(sessions.length, 10)} sessions
              </span>
            </div>
            <SparkChart sessions={sessions.slice(0, 10)} />
          </div>
        )}

        {/* Skill breakdown */}
        {sessions.length > 0 && (
          <div
            className="p-6 rounded-2xl mb-5 animate-fade-in delay-200"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: "#444", letterSpacing: "0.1em" }}
            >
              Average skill breakdown
            </p>
            <div className="space-y-4">
              {SCORE_LABELS.map((key) => (
                <SkillBar
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={avgSkills[key]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div className="animate-fade-in delay-300">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#444", letterSpacing: "0.1em" }}
          >
            Recent sessions
          </p>

          {sessions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(255,178,26,0.08)",
                  border: "1px solid rgba(255,178,26,0.15)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  style={{ color: "#FFB21A" }}
                >
                  <rect
                    x="10"
                    y="3"
                    width="8"
                    height="14"
                    rx="4"
                    fill="currentColor"
                    opacity="0.7"
                  />
                  <path
                    d="M5 14a9 9 0 0 0 18 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="14"
                    y1="23"
                    x2="14"
                    y2="25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p
                className="font-semibold mb-2"
                style={{ color: "#C8C8C8", fontSize: "1rem" }}
              >
                Your progress starts here.
              </p>
              <p
                className="mb-6 text-center"
                style={{ color: "#555", fontSize: "0.85rem", maxWidth: 260 }}
              >
                Complete your first speaking session to see your improvement
                over time.
              </p>
              <button
                onClick={() => onNavigate("topic-selection")}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
                style={{ background: "#FFB21A", color: "#0D0D0D" }}
              >
                Start Speaking
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M2 6.5h9M7 3l3.5 3.5L7 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((sess) => (
                <div key={sess.id}>
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === sess.id ? null : sess.id)
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
                    style={{
                      background: "#111111",
                      border:
                        expandedId === sess.id
                          ? "1px solid rgba(255,178,26,0.2)"
                          : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold tabular-nums text-sm"
                      style={{
                        background: "rgba(255,178,26,0.1)",
                        color: "#FFB21A",
                      }}
                    >
                      {sess.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium truncate"
                        style={{ color: "#C8C8C8", fontSize: "0.9rem" }}
                      >
                        {sess.topicTitle}
                      </p>
                      <p style={{ color: "#555", fontSize: "0.78rem" }}>
                        {formatDate(sess.date)} ·{" "}
                        {formatTime(sess.speakingTime)}
                      </p>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{
                        color: "#444",
                        transition: "transform 0.2s",
                        transform:
                          expandedId === sess.id
                            ? "rotate(180deg)"
                            : "rotate(0)",
                        flexShrink: 0,
                      }}
                    >
                      <path
                        d="M3 5l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {expandedId === sess.id && (
                    <div
                      className="mt-1 p-4 rounded-xl animate-fade-in"
                      style={{
                        background: "rgba(255,178,26,0.03)",
                        border: "1px solid rgba(255,178,26,0.1)",
                      }}
                    >
                      <div className="flex flex-wrap justify-center gap-4 mb-4">
                        {SCORE_LABELS.map((key) => (
                          <div key={key} className="text-center">
                            <p
                              className="font-bold tabular-nums text-sm"
                              style={{ color: "#FFB21A" }}
                            >
                              {sess.analysis.scores[key]}
                            </p>
                            <p className="text-xs" style={{ color: "#555" }}>
                              {key.slice(0, 4)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          onViewSession(sess)
                          onNavigate("results")
                        }}
                        className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                        style={{
                          background: "#FFB21A",
                          color: "#0D0D0D",
                        }}
                      >
                        View full report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-10 animate-fade-in delay-400">
          <button
            onClick={() => onNavigate("topic-selection")}
            className="w-full py-4 rounded-xl font-semibold transition-all duration-200"
            style={{ background: "#FFB21A", color: "#0D0D0D" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#FFC33A")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#FFB21A")
            }
          >
            Start a new session
          </button>
        </div>
      </div>
    </div>
  )
}
