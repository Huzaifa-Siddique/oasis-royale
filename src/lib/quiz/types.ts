export type QuizDifficulty = "easy" | "medium" | "hard"

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  difficulty: QuizDifficulty
  questionCount: number
  timeLimitPerQuestion?: number
  image?: string
  questions: QuizQuestion[]
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  answers: (number | null)[]
  completedAt: Date
  timePerQuestion: number[]
}
