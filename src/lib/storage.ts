import type { Session } from "./types"

const STORAGE_KEY = "voca_sessions"

export function getSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Session[] : []
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  const sessions = getSessions()
  sessions.unshift(session)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id)
}

const PREFS_KEY = "voca_prefs"

/**
 * Single source of truth for the practice-session settings, persisted
 * across the whole Setup → Roulette → Preparation → Speaking flow.
 */
interface Prefs {
  difficulty: "beginner" | "intermediate" | "advanced"
  /** Preparation countdown duration, in minutes. */
  preparationTime: number
  /** Speaking duration, in minutes — drives the speaking countdown. */
  speakingTime: number
}

const DEFAULT_PREFS: Prefs = {
  difficulty: "intermediate",
  preparationTime: 10,
  speakingTime: 3,
}

export function getPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw
      ? { ...DEFAULT_PREFS, ...JSON.parse(raw) as Partial<Prefs> }
      : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: Partial<Prefs>): void {
  const current = getPrefs()
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }))
}

export function getRecentTopicIds(n = 3): string[] {
  return getSessions()
    .slice(0, n)
    .map((s) => s.topicId)
}


export function getStats() {
  const sessions = getSessions()
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalSpeakingTime: 0,
      averageScore: 0,
      currentStreak: 0,
    }
  }

  const totalSpeakingTime = sessions.reduce(
    (s, sess) => s + sess.speakingTime,
    0,
  )
  const averageScore = Math.round(
    sessions.reduce((s, sess) => s + sess.score, 0) / sessions.length,
  )

  // Calculate streak: consecutive days with at least one session
  const dates = [...new Set(sessions.map((s) => s.date.split("T")[0]))].sort(
    (a, b) => b.localeCompare(a),
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    const exp = expected.toISOString().split("T")[0]
    if (dates[i] === exp) streak++
    else break
  }

  return {
    totalSessions: sessions.length,
    totalSpeakingTime,
    averageScore,
    currentStreak: streak,
  }
}
