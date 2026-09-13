export type Screen = "home" | "topic-selection" | "topic-reveal" | "preparation" | "speaking" | "analyzing" | "results" | "progress"

export type Difficulty = "beginner" | "intermediate" | "advanced"

export interface Topic {
  id: string
  title: string
  difficulty: Difficulty
  thinkAbout: string[]
  include: string[]
  estimatedTime?: string
}

export interface AnalysisResult {
  overallScore: number
  scores: {
    fluency: number
    grammar: number
    vocabulary: number
    clarity: number
    relevance: number
    structure: number
    development: number
  }
  summary: string
  strengths: string[]
  improvements: {
    category: string
    title: string
    description: string
  }[]
  grammarCorrections: {
    original: string
    corrected: string
    explanation: string
  }[]
  vocabularyUpgrades: {
    original: string
    better: string
    reason: string
  }[]
  nextChallenge: {
    prompt: string
    reason: string
  }
}

export interface Session {
  id: string
  date: string
  difficulty: Difficulty
  preparationTime: number
  speakingTime: number
  topic: Topic
  transcript: string
  overallScore: number
  scores: AnalysisResult['scores']
  analysis: AnalysisResult
}
