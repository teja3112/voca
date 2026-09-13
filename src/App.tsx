import { useState } from "react"
import type { Screen, Session, Topic } from "./lib/types"
import Home from "./screens/Home"
import TopicSelection from "./screens/TopicSelection"
import TopicReveal from "./screens/TopicReveal"
import Preparation from "./screens/Preparation"
import Speaking from "./screens/Speaking"
import Analyzing from "./screens/Analyzing"
import Results from "./screens/Results"
import Progress from "./screens/Progress"

function VocaLogo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-bold transition-opacity duration-200 hover:opacity-80"
      style={{ letterSpacing: "-0.03em", color: "#F0F0F0", fontSize: "1.2rem" }}
    >
      VOCA
    </button>
  )
}

function Nav({
  screen,
  onNavigate,
}: {
  screen: Screen
  onNavigate: (s: Screen) => void
}) {
  const hideOnScreens: Screen[] = ["speaking", "analyzing"]
  if (hideOnScreens.includes(screen)) return null

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2"
      style={{
        background:
          "linear-gradient(to bottom, rgba(9,9,9,0.95) 0%, rgba(9,9,9,0.8) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <VocaLogo onClick={() => onNavigate("home")} />

      {!["preparation", "topic-reveal"].includes(screen) && (
        <>
          {/* Desktop CTA */}
          <button
            onClick={() => onNavigate("topic-selection")}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200"
            style={{ background: "#FFB21A", color: "#0D0D0D", fontSize: "0.95rem" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "#FFC33A")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "#FFB21A")
            }
          >
            Start Speaking
          </button>

          {/* Mobile CTA */}
          <button
            onClick={() => onNavigate("topic-selection")}
            className="sm:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: "#FFB21A",
              color: "#0D0D0D",
              fontSize: "0.85rem",
            }}
          >
            Start Speaking
          </button>
        </>
      )}
    </nav>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [transcript, setTranscript] = useState("")
  const [duration, setDuration] = useState(0)

  function handleNavigate(s: Screen) {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleTopicSelect(topic: Topic) {
    setSelectedTopic(topic)
    setTranscript("")
    setDuration(0)
  }

  function handleSpeakingFinish(t: string, d: number) {
    setTranscript(t)
    setDuration(d)
    handleNavigate("analyzing")
  }

  function handleResults(session: Session) {
    setCurrentSession(session)
  }

  function handleViewSession(session: Session) {
    setCurrentSession(session)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#090909" }}>
      <Nav screen={screen} onNavigate={handleNavigate} />

      {/* Screen router */}
      {screen === "home" && <Home onNavigate={handleNavigate} />}

      {screen === "topic-selection" && (
        <TopicSelection onNavigate={handleNavigate} onSelectTopic={handleTopicSelect} />
      )}

      {screen === "topic-reveal" && (
        <TopicReveal
          onNavigate={handleNavigate}
          onSelectTopic={handleTopicSelect}
        />
      )}

      {screen === "preparation" && (
        <Preparation topic={selectedTopic} onNavigate={handleNavigate} />
      )}

      {screen === "speaking" && (
        <Speaking
          topic={selectedTopic}
          onNavigate={handleNavigate}
          onFinish={handleSpeakingFinish}
        />
      )}

      {screen === "analyzing" && (
        <Analyzing
          topic={selectedTopic}
          transcript={transcript}
          duration={duration}
          onNavigate={handleNavigate}
          onResults={handleResults}
        />
      )}

      {screen === "results" && (
        <Results session={currentSession} onNavigate={handleNavigate} />
      )}

      {screen === "progress" && (
        <Progress
          onNavigate={handleNavigate}
          onViewSession={handleViewSession}
        />
      )}
    </div>
  )
}
