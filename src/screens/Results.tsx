import { useState, useEffect } from "react"
import type { Session, Screen } from "../lib/types"
import { getPrefs, savePrefs } from "../lib/storage"

interface Props {
  session: Session | null
  onNavigate: (screen: Screen) => void
}

export default function Results({ session, onNavigate }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!session) return
    let current = 0
    const target = session.overallScore
    const step = target / 30 // Approx 30 frames
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [session])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#777" }}>No session data found.</p>
      </div>
    )
  }

  const { analysis } = session

  const getLabel = (score: number) => {
    if (score >= 90) return "Excellent response"
    if (score >= 80) return "Strong response"
    if (score >= 70) return "Good foundation"
    return "Room to grow"
  }

  const handleNextChallenge = () => {
    // Optionally setup the next challenge in prefs if needed, 
    // but the prompt says just start another practice session with that topic.
    // For now we will route back to practice with the same topic.
    onNavigate("topic-selection")
  }

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#888" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: "#FFF6E5" }}>{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${score}%`, background: "#FFB21A", opacity: 0.85 }} 
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-5" style={{ background: "#090909" }}>
      <div className="w-full max-w-3xl">
        
        {/* Results Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <p className="font-semibold uppercase tracking-widest mb-3" style={{ color: "#FFB21A", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
            Your Results
          </p>
          <h1 className="font-bold mb-8" style={{ fontSize: "1.75rem", color: "#F0F0F0", letterSpacing: "-0.02em" }}>
            {session.topicTitle}
          </h1>

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative flex items-center justify-center mb-4" style={{ width: 140, height: 140 }}>
              <svg className="-rotate-90" viewBox="0 0 100 100" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle 
                  cx="50" cy="50" r="46" fill="none" stroke="#FFB21A" strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeDasharray={2 * Math.PI * 46} 
                  strokeDashoffset={2 * Math.PI * 46 * (1 - animatedScore / 100)} 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="flex items-baseline">
                <span className="font-bold" style={{ fontSize: "3.5rem", color: "#F0F0F0", letterSpacing: "-0.03em" }}>{animatedScore}</span>
                <span className="font-semibold" style={{ fontSize: "1.2rem", color: "#666" }}>/100</span>
              </div>
            </div>
            <p className="font-bold uppercase tracking-wider" style={{ color: "#FFB21A", fontSize: "0.95rem", letterSpacing: "0.08em" }}>
              {getLabel(animatedScore)}
            </p>
          </div>
          
          <p className="mx-auto leading-relaxed" style={{ color: "#AAA", fontSize: "1.1rem", maxWidth: 500 }}>
            {analysis.summary}
          </p>
        </div>

        <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {/* Language */}
          <div className="animate-fade-in delay-100">
            <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
              Language
            </p>
            <ScoreBar label="Fluency" score={analysis.scores.fluency} />
            <ScoreBar label="Grammar" score={analysis.scores.grammar} />
            <ScoreBar label="Vocabulary" score={analysis.scores.vocabulary} />
            <ScoreBar label="Clarity" score={analysis.scores.clarity} />
          </div>

          {/* Content */}
          <div className="animate-fade-in delay-200">
            <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
              Content
            </p>
            <ScoreBar label="Relevance" score={analysis.scores.relevance} />
            <ScoreBar label="Structure" score={analysis.scores.structure} />
            <ScoreBar label="Development" score={analysis.scores.development} />
          </div>
        </div>

        <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="mb-12 animate-fade-in delay-300">
            <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
              What you did well
            </p>
            <div className="space-y-4">
              {analysis.strengths.map((str, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22, background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5 9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ color: "#CCC", fontSize: "1.05rem", lineHeight: 1.5 }}>{str}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />

        {/* Improvements */}
        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="mb-12 animate-fade-in delay-300">
            <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
              Improve next
            </p>
            <div className="space-y-6">
              {analysis.improvements.slice(0,3).map((imp, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="font-bold text-lg" style={{ color: "#FFB21A", opacity: 0.8 }}>
                    0{i+1}
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest mb-1 block" style={{ color: "#777" }}>{imp.category}</span>
                    <p className="font-bold mb-1" style={{ color: "#F0F0F0", fontSize: "1.1rem" }}>{imp.title}</p>
                    <p style={{ color: "#AAA", fontSize: "1rem", lineHeight: 1.5 }}>"{imp.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grammar Coach */}
        {analysis.grammarCorrections && analysis.grammarCorrections.length > 0 ? (
          <>
            <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />
            <div className="mb-12 animate-fade-in delay-400">
              <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
                Grammar Coach
              </p>
              <div className="space-y-5">
                {analysis.grammarCorrections.slice(0,4).map((gc, i) => (
                  <div key={i} className="p-5 rounded-2xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="mb-3">
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#F87171" }}>You said</span>
                      <p style={{ color: "#AAA", fontSize: "1.05rem" }}>"{gc.original}"</p>
                    </div>
                    <div className="mb-3">
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#4ADE80" }}>Better</span>
                      <p style={{ color: "#E0E0E0", fontSize: "1.05rem" }}>"{gc.corrected}"</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#777" }}>Why</span>
                      <p style={{ color: "#888", fontSize: "0.95rem" }}>{gc.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-12 animate-fade-in delay-400">
             <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
                Grammar Coach
             </p>
             <p style={{ color: "#AAA", fontSize: "1.05rem" }}>Your grammar was strong in this response.</p>
          </div>
        )}

        {/* Vocabulary Upgrades */}
        {analysis.vocabularyUpgrades && analysis.vocabularyUpgrades.length > 0 && (
          <>
            <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />
            <div className="mb-12 animate-fade-in delay-500">
              <p className="font-semibold uppercase tracking-widest mb-6" style={{ color: "#F0F0F0", letterSpacing: "0.1em", fontSize: "0.9rem" }}>
                Vocabulary Upgrade
              </p>
              <div className="space-y-5">
                {analysis.vocabularyUpgrades.slice(0,4).map((vu, i) => (
                  <div key={i} className="p-5 rounded-2xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="mb-3">
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#F87171" }}>You said</span>
                      <p style={{ color: "#AAA", fontSize: "1.05rem" }}>"{vu.original}"</p>
                    </div>
                    <div className="mb-3">
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#4ADE80" }}>Try</span>
                      <p style={{ color: "#E0E0E0", fontSize: "1.05rem" }}>"{vu.better}"</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest font-semibold block mb-1" style={{ color: "#777" }}>Why</span>
                      <p style={{ color: "#888", fontSize: "0.95rem" }}>{vu.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />

        <hr className="mb-10 opacity-10" style={{ borderColor: "#FFF" }} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in delay-600">
          <button
            onClick={() => onNavigate("topic-selection")}
            className="px-8 py-4 rounded-xl font-semibold transition-all duration-200"
            style={{ background: "#FFB21A", color: "#0D0D0D", fontSize: "1.1rem" }}
          >
            Practice Again
          </button>
          <button
            onClick={() => onNavigate("progress")}
            className="px-8 py-4 rounded-xl font-semibold transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#CCC", fontSize: "1.1rem" }}
          >
            View Progress
          </button>
        </div>

      </div>
    </div>
  )
}
