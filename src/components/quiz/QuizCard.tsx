"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { Quiz } from "@/lib/quiz/types"

const difficultyColors: Record<string, string> = {
  easy: "text-green-400 border-green-400/30 bg-green-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  hard: "text-red-400 border-red-400/30 bg-red-400/10",
}

const difficultyLabels: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <Link href={`/quiz/${quiz.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="glassmorphism rounded-2xl p-6 cursor-pointer group h-full flex flex-col"
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difficultyColors[quiz.difficulty]}`}
          >
            {difficultyLabels[quiz.difficulty]}
          </span>
          <span className="text-sm text-foreground/50 font-sans">
            {quiz.questionCount} questions
          </span>
        </div>

        <h3 className="text-xl font-heading text-gold mb-2 group-hover:text-amber-300 transition-colors">
          {quiz.title}
        </h3>

        <p className="text-foreground/70 text-sm font-sans leading-relaxed flex-1">
          {quiz.description}
        </p>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-foreground/40 font-sans">
            {quiz.timeLimitPerQuestion
              ? `${quiz.timeLimitPerQuestion}s per question`
              : "No time limit"}
          </span>
          <span className="text-gold text-sm font-heading group-hover:translate-x-1 transition-transform">
            Start Quiz &rarr;
          </span>
        </div>
      </motion.div>
    </Link>
  )
}
