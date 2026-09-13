import type { Screen } from "../lib/types"

interface Props {
  onNavigate: (screen: Screen) => void
}

export default function Home({ onNavigate }: Props) {
  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-20 text-center overflow-hidden"
      style={{ background: "#090909" }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,178,26,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Eyebrow */}
      <div className="animate-fade-in mb-8">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(255,178,26,0.08)",
            border: "1px solid rgba(255,178,26,0.2)",
            color: "#FFB21A",
            letterSpacing: "0.12em",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#FFB21A" }}
          />
          AI-Powered English Speaking Coach
        </span>
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in delay-100 font-bold leading-none mb-6 max-w-4xl"
        style={{
          fontSize: "clamp(2.375rem, 6vw, 4rem)",
          letterSpacing: "-0.03em",
          color: "#F0F0F0",
        }}
      >
        Speak better. <br className="hidden sm:block" />
        Speak <span style={{ color: "#FFB21A" }}>without fear.</span>
      </h1>

      {/* Sub */}
      <p
        className="animate-fade-in delay-200 max-w-xl mb-10 leading-relaxed"
        style={{
          fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
          color: "#999999",
          fontWeight: 400,
        }}
      >
        Practice speaking in English, get instant AI feedback, and build
        confidence one conversation at a time.
      </p>

      {/* CTA */}
      <div className="animate-fade-in delay-300">
        <button
          onClick={() => onNavigate("topic-selection")}
          className="inline-flex items-center rounded-xl font-semibold transition-all duration-200"
          style={{
            padding: "16px 30px",
            background: "#FFB21A",
            color: "#0D0D0D",
            fontSize: "1.05rem",
            letterSpacing: "-0.01em",
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
          Start Now
        </button>
      </div>

      {/* Credibility line */}
      <p
        className="animate-fade-in delay-400 mt-8"
        style={{ color: "#555", fontSize: "0.9rem", letterSpacing: "0.02em" }}
      >
        Practice speaking. Get feedback. Improve every day.
      </p>
    </section>
  )
}
