"use client"

import { motion } from "framer-motion"
import { Trophy, RefreshCw, Home, Check, X } from "lucide-react"
import Link from "next/link"
import type { QuizResult as QuizResultType, Quiz } from "@/lib/quiz/types"

interface QuizResultProps {
  quiz: Quiz
  result: QuizResultType
  onRestart: () => void
}

export default function QuizResult({ quiz, result, onRestart }: QuizResultProps) {
  const percentage = Math.round((result.score / result.totalQuestions) * 100)

  const getGrade = () => {
    if (percentage >= 90) return { label: "Master Chef", color: "text-gold" }
    if (percentage >= 70) return { label: "Sous Chef", color: "text-teal" }
    if (percentage >= 50) return { label: "Line Cook", color: "text-amber-400" }
    return { label: "Dishwasher", color: "text-foreground/50" }
  }

  const grade = getGrade()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glassmorphism rounded-2xl p-8 max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6"
      >
        <Trophy className="w-10 h-10 text-gold" />
      </motion.div>

      <h2 className="text-2xl font-heading text-foreground mb-2">Quiz Complete!</h2>
      <p className={`text-lg font-heading ${grade.color} mb-6`}>{grade.label}</p>

      <div className="flex items-baseline justify-center gap-1 mb-8">
        <span className="text-5xl font-heading text-gold">{result.score}</span>
        <span className="text-xl text-foreground/50 font-sans">
          / {result.totalQuestions}
        </span>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full rounded-full ${
            percentage >= 70 ? "bg-gold" : percentage >= 50 ? "bg-amber-400" : "bg-foreground/30"
          }`}
        />
      </div>

      <div className="space-y-2 mb-8">
        {quiz.questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/5"
          >
            {result.answers[i] === q.correctAnswer ? (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className="text-xs text-foreground/70 font-sans truncate">
              {q.question.length > 60 ? q.question.slice(0, 60) + "..." : q.question}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl border border-gold/30 bg-gold/10 text-gold font-heading text-sm hover:bg-gold/20 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Quiz
        </button>
        <Link
          href="/quiz"
          className="w-full py-3 rounded-xl border border-white/10 text-foreground/70 font-sans text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Quizzes
        </Link>
      </div>
    </motion.div>
  )
}
