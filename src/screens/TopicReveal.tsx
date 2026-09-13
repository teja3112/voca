import { useEffect, useMemo, useState } from "react"
import { pickTopic, TOPICS } from "../lib/topics"
import { getPrefs, getRecentTopicIds } from "../lib/storage"
import type { Difficulty, Screen, Topic } from "../lib/types"
import { useTopicRoulette } from "../lib/useTopicRoulette"

interface Props {
  onNavigate: (screen: Screen) => void
  onSelectTopic: (topic: Topic) => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

const ROW_HEIGHT = 88

export default function TopicReveal({ onNavigate, onSelectTopic }: Props) {
  const prefs = getPrefs()
  
  const [topic, setTopic] = useState<Topic>(() =>
    pickTopic(
      prefs.difficulty,
      getRecentTopicIds(),
      undefined,
      prefs.preparationTime,
    ),
  )

  const [revealed, setRevealed] = useState(false)

  const candidateTitles = useMemo(() => {
    return TOPICS.filter((t) => t.difficulty === prefs.difficulty).map(
      (t) => t.title,
    )
  }, [prefs.difficulty])

  const roulette = useTopicRoulette(candidateTitles)

  useEffect(() => {
    if (!revealed) {
      roulette.run(topic.title, () => setRevealed(true))
    }
  }, [revealed, topic.title, roulette.run])

  function handleSpinAgain() {
    const newTopic = pickTopic(
      prefs.difficulty,
      [...getRecentTopicIds(), topic.id],
      undefined,
      prefs.preparationTime,
    )
    setTopic(newTopic)
    setRevealed(false)
  }

  function handleContinue() {
    const topicWithDuration: Topic = {
      ...topic,
      estimatedTime: `${prefs.speakingTime} min`,
    }
    onSelectTopic(topicWithDuration)
    onNavigate("preparation")
  }

  const randomDecoy = (exclude: string) => {
    const pool = candidateTitles.filter((t) => t !== exclude)
    if (pool.length === 0) return exclude
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Flavor text for the rows surrounding the center selection zone.
  // Purely decorative — recomputed each tick, never influences the outcome.
  const sideRows = useMemo(() => {
    const center = roulette.display || topic.title
    return [
      randomDecoy(center),
      randomDecoy(center),
      randomDecoy(center),
      randomDecoy(center),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roulette.tickKey])

  const centerText = roulette.display || topic.title
  const rowsToShow = [
    sideRows[0],
    sideRows[1],
    centerText,
    sideRows[2],
    sideRows[3],
  ]

  return (
    <div
      className="screen-enter min-h-screen flex flex-col items-center justify-center px-5 py-24 text-center"
      style={{ background: "#090909" }}
    >
      <div className="w-full" style={{ maxWidth: 860 }}>
        {/* Heading */}
        <p
          className="font-semibold uppercase tracking-widest mb-3"
          style={{
            color: "#FFB21A",
            letterSpacing: "0.14em",
            fontSize: "1.2rem",
          }}
        >
          {revealed ? "Your Challenge" : "Your Next Challenge"}
        </p>
        {!revealed && (
          <p className="mb-10" style={{ color: "#AAA", fontSize: "1.35rem" }}>
            Finding the right topic for you...
          </p>
        )}

        {!revealed ? (
          /* ---- Roulette reel ---- */
          <div
            className="relative mx-auto"
            style={{ height: ROW_HEIGHT * 5, maxWidth: 520 }}
          >
            {/* Fade masks */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: ROW_HEIGHT * 1.6,
                background: "linear-gradient(#090909, transparent)",
                zIndex: 2,
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: ROW_HEIGHT * 1.6,
                background: "linear-gradient(transparent, #090909)",
                zIndex: 2,
              }}
            />

            {/* Selection zone indicator */}
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: ROW_HEIGHT * 2,
                height: ROW_HEIGHT,
                borderTop: "1px solid rgba(255,178,26,0.2)",
                borderBottom: "1px solid rgba(255,178,26,0.2)",
                background: "rgba(255,178,26,0.03)",
              }}
            />

            <div
              key={roulette.tickKey}
              className="roulette-tick"
              style={{ animationDuration: `${roulette.tickDurationMs}ms` }}
            >
              {rowsToShow.map((text, i) => {
                const dist = Math.abs(i - 2)
                const rowStyle =
                  dist === 0
                    ? {
                        fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
                        fontWeight: 700,
                        color: "#F5F5F5",
                        textShadow: "0 0 22px rgba(255,178,26,0.35)",
                      }
                    : dist === 1
                      ? {
                          fontSize: "1.65rem",
                          fontWeight: 500,
                          color: "#777",
                          opacity: 0.5,
                          filter: "blur(0.4px)",
                        }
                      : {
                          fontSize: "1.35rem",
                          fontWeight: 500,
                          color: "#4a4a4a",
                          opacity: 0.35,
                          filter: "blur(1px)",
                        }
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center px-4"
                    style={{ height: ROW_HEIGHT, ...rowStyle }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.2,
                        maxWidth: "100%",
                      }}
                    >
                      {text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {/* ---- Locked reveal ---- */}
            <div key={topic.id} className="roulette-settle mb-10">
              <h2
                className="font-bold mb-4"
                style={{
                  fontSize: "clamp(2.8rem, 7.5vw, 4rem)",
                  letterSpacing: "-0.02em",
                  color: "#F5F5F5",
                  lineHeight: 1.15,
                  textShadow: "0 0 26px rgba(255,178,26,0.25)",
                }}
              >
                {topic.title}
              </h2>
              <p
                style={{
                  color: "#B5B5B5",
                  fontSize: "1.35rem",
                  fontWeight: 500,
                  marginBottom: 20,
                }}
              >
                {DIFFICULTY_LABELS[topic.difficulty]} · {prefs.preparationTime}{" "}
                min preparation
              </p>
              <p
                className="max-w-xl mx-auto"
                style={{ color: "#AAA", fontSize: "1.25rem", lineHeight: 1.65 }}
              >
                {topic.description}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-200">
              <button
                onClick={handleSpinAgain}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold transition-all duration-200"
                style={{ background: "#222", color: "#F0F0F0", border: "1px solid rgba(255,255,255,0.1)", fontSize: "1.05rem" }}
                onMouseEnter={(e) => ((e.currentTarget).style.background = "#2A2A2A")}
                onMouseLeave={(e) => ((e.currentTarget).style.background = "#222")}
              >
                ↻ Spin Again
              </button>
              <button
                onClick={handleContinue}
                className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-semibold transition-all duration-200"
                style={{ background: "#FFB21A", color: "#0D0D0D", fontSize: "1.05rem" }}
                onMouseEnter={(e) => ((e.currentTarget).style.background = "#FFC33A")}
                onMouseLeave={(e) => ((e.currentTarget).style.background = "#FFB21A")}
              >
                Continue →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
