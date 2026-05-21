"use client"

import { motion } from "framer-motion"

interface QuizProgressProps {
  current: number
  total: number
  answers: (number | null)[]
  timeRemaining: number | null
  onNavigate: (index: number) => void
}

export default function QuizProgress({
  current,
  total,
  answers,
  timeRemaining,
  onNavigate,
}: QuizProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-foreground/60 font-sans">
          Question {current + 1} of {total}
        </span>
        {timeRemaining !== null && (
          <span
            className={`text-sm font-mono ${
              timeRemaining <= 5 ? "text-red-400" : "text-foreground/60"
            }`}
          >
            {timeRemaining}s
          </span>
        )}
      </div>

      <div className="flex gap-1.5 mb-3">
        {answers.map((answer, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-gold"
                : answer !== null
                  ? "bg-gold/50"
                  : "bg-white/10 hover:bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gold"
          initial={{ width: 0 }}
          animate={{
            width: `${((current + 1) / total) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}
