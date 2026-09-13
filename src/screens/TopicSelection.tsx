import { useEffect, useState } from "react"
import { getPrefs, savePrefs } from "../lib/storage"
import type { Difficulty, Screen } from "../lib/types"

interface Props {
  onNavigate: (screen: Screen) => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

function TimeSelector({
  label,
  options,
  value,
  onChange,
  onError,
  defaultCustomValue,
}: {
  label: string
  options: number[]
  value: number
  onChange: (n: number) => void
  onError: (hasError: boolean) => void
  defaultCustomValue: number
}) {
  const isValueCustom = !options.includes(value)
  const [mode, setMode] = useState<'preset' | 'custom'>(isValueCustom ? 'custom' : 'preset')
  const [customInputValue, setCustomInputValue] = useState<string>(String(isValueCustom ? value : defaultCustomValue))
  const [error, setError] = useState("")

  useEffect(() => {
    onError(!!error && mode === 'custom')
  }, [error, mode, onError])

  function handlePresetClick(m: number) {
    setMode('preset')
    onChange(m)
  }

  function handleCustomClick() {
    setMode('custom')
    const n = parseInt(customInputValue, 10)
    if (!customInputValue || isNaN(n) || n < 1 || n > 60) {
      setError("Enter a valid duration (1-60).")
    } else {
      setError("")
      onChange(n)
    }
  }

  function updateCustom(newStr: string) {
    setCustomInputValue(newStr)
    const n = parseInt(newStr, 10)
    if (!newStr || isNaN(n) || n < 1 || n > 60) {
      setError("Enter a valid duration (1-60).")
    } else {
      setError("")
      if (mode === 'custom') {
        onChange(n)
      }
    }
  }

  function decrement() {
    let n = parseInt(customInputValue, 10) || 0
    n = Math.max(1, n - 1)
    updateCustom(String(n))
  }

  function increment() {
    let n = parseInt(customInputValue, 10) || 0
    n = Math.min(60, n + 1)
    updateCustom(String(n))
  }

  return (
    <div className="mb-8">
      <p
        className="font-semibold uppercase tracking-widest mb-3"
        style={{ color: "#555", letterSpacing: "0.1em", fontSize: "0.92rem" }}
      >
        {label}
      </p>
      <div className="relative">
        <div
          className="flex flex-wrap gap-2 p-1.5 rounded-2xl"
          style={{
            background: "#0F0F0F",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {options.map((m) => {
            const active = mode === 'preset' && value === m
            return (
              <button
                key={m}
                onClick={() => handlePresetClick(m)}
                className="rounded-xl font-semibold"
                style={{
                  flex: "1 1 84px",
                  padding: "15px 4px",
                  fontSize: "1.1rem",
                  transition: "all 250ms ease",
                  background: active ? "rgba(255,178,26,0.12)" : "transparent",
                  color: active ? "#FFF6E5" : "#4A4A4A",
                  border: active
                    ? "1px solid rgba(255,178,26,0.55)"
                    : "1px solid transparent",
                  boxShadow: active ? "0 0 20px rgba(255,178,26,0.15)" : "none",
                }}
              >
                {m} min
              </button>
            )
          })}
          <button
            onClick={handleCustomClick}
            className="rounded-xl font-semibold"
            style={{
              flex: "1 1 84px",
              padding: "15px 4px",
              fontSize: "1.1rem",
              transition: "all 250ms ease",
              background: mode === 'custom' ? "rgba(255,178,26,0.12)" : "transparent",
              color: mode === 'custom' ? "#FFF6E5" : "#4A4A4A",
              border: mode === 'custom'
                ? "1px solid rgba(255,178,26,0.55)"
                : "1px solid transparent",
              boxShadow: mode === 'custom' ? "0 0 20px rgba(255,178,26,0.15)" : "none",
            }}
          >
            Custom
          </button>
        </div>
      </div>
      
      {mode === 'custom' && (
        <div 
          className="mt-4 p-5 rounded-2xl animate-fade-in flex flex-col items-center"
          style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p
            className="font-semibold uppercase tracking-widest mb-4"
            style={{
              color: "#888",
              letterSpacing: "0.1em",
              fontSize: "0.8rem",
            }}
          >
            Custom Duration
          </p>
          <div className="flex items-center gap-6 mb-1">
            <button
              onClick={decrement}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "#222", color: "#F0F0F0", fontSize: "1.25rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A2A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#222")}
            >
              −
            </button>
            <div className="flex items-baseline gap-2 min-w-[80px] justify-center">
              <input
                type="text"
                value={customInputValue}
                onChange={(e) => updateCustom(e.target.value)}
                className="bg-transparent text-center font-bold text-white outline-none"
                style={{ fontSize: "2.5rem", width: "3.5rem" }}
              />
            </div>
            <button
              onClick={increment}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "#222", color: "#F0F0F0", fontSize: "1.25rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A2A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#222")}
            >
              +
            </button>
          </div>
          <p className="mt-1 font-medium" style={{ color: "#666", fontSize: "0.95rem" }}>
            MINUTES
          </p>
          {error && (
            <p className="mt-4" style={{ color: "#F87171", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function TopicSelection({ onNavigate }: Props) {
  const prefs = getPrefs()
  
  const [difficulty, setDifficultyState] = useState<Difficulty>(prefs.difficulty)
  const setDifficulty = (d: Difficulty) => {
    setDifficultyState(d)
    savePrefs({ difficulty: d })
  }

  const [preparationTime, setPreparationTimeState] = useState(prefs.preparationTime)
  const setPreparationTime = (t: number) => {
    setPreparationTimeState(t)
    savePrefs({ preparationTime: t })
  }

  const [speakingTime, setSpeakingTimeState] = useState(prefs.speakingTime)
  const setSpeakingTime = (t: number) => {
    setSpeakingTimeState(t)
    savePrefs({ speakingTime: t })
  }

  const [prepError, setPrepError] = useState(false)
  const [speakError, setSpeakError] = useState(false)

  const hasError = prepError || speakError

  function handleFindTopic() {
    if (hasError) return
    onNavigate("topic-reveal")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-24"
      style={{ background: "#090909" }}
    >
      <div className="w-full" style={{ maxWidth: 860 }}>
        {/* Header */}
        <div className="mb-12 animate-fade-in text-center sm:text-left">
          <p
            className="font-semibold uppercase tracking-widest mb-3"
            style={{
              color: "#FFB21A",
              letterSpacing: "0.12em",
              fontSize: "0.95rem",
            }}
          >
            Practice
          </p>
          <h1
            className="font-bold mb-4"
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.25rem)",
              letterSpacing: "-0.025em",
              color: "#F0F0F0",
            }}
          >
            Prepare for your challenge
          </h1>
          <p style={{ color: "#888", fontSize: "1.15rem", lineHeight: 1.6 }}>
            We'll choose a topic that matches your level and give you time to
            prepare.
          </p>
        </div>

        {/* Difficulty */}
        <div className="mb-8 animate-fade-in delay-100">
          <p
            className="font-semibold uppercase tracking-widest mb-3"
            style={{
              color: "#555",
              letterSpacing: "0.1em",
              fontSize: "0.92rem",
            }}
          >
            Difficulty
          </p>
          <div
            className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl"
            style={{
              background: "#0F0F0F",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
              (d) => {
                const active = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="rounded-xl font-semibold"
                    style={{
                      padding: "15px 4px",
                      fontSize: "1.1rem",
                      transition: "all 250ms ease",
                      background: active
                        ? "rgba(255,178,26,0.12)"
                        : "transparent",
                      color: active ? "#FFF6E5" : "#4A4A4A",
                      border: active
                        ? "1px solid rgba(255,178,26,0.55)"
                        : "1px solid transparent",
                      boxShadow: active
                        ? "0 0 20px rgba(255,178,26,0.15)"
                        : "none",
                    }}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                )
              },
            )}
          </div>
        </div>

        {/* Preparation time */}
        <div className="animate-fade-in delay-200">
          <TimeSelector
            label="Preparation time"
            options={[5, 10, 15]}
            value={preparationTime}
            onChange={setPreparationTime}
            onError={setPrepError}
            defaultCustomValue={20}
          />
        </div>

        {/* Speaking time */}
        <div className="animate-fade-in delay-300 mb-4">
          <TimeSelector
            label="Speaking time"
            options={[1, 2, 3, 5]}
            value={speakingTime}
            onChange={setSpeakingTime}
            onError={setSpeakError}
            defaultCustomValue={4}
          />
        </div>

        {/* CTA */}
        <button
          disabled={hasError}
          onClick={handleFindTopic}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 animate-fade-in delay-300"
          style={{
            padding: "19px 0",
            background: hasError ? "#333" : "#FFB21A",
            color: hasError ? "#666" : "#0D0D0D",
            fontSize: "1.15rem",
            cursor: hasError ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!hasError) e.currentTarget.style.background = "#FFC33A"
          }}
          onMouseLeave={(e) => {
            if (!hasError) e.currentTarget.style.background = "#FFB21A"
          }}
        >
          Start Practice
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
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
