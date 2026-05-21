"use client"

import { motion } from "framer-motion"
import type { QuizQuestion as QuizQuestionType } from "@/lib/quiz/types"
import { Check, X } from "lucide-react"

interface QuizQuestionProps {
  question: QuizQuestionType
  questionIndex: number
  selectedAnswer: number | null
  isAnswered: boolean
  onSelectAnswer: (index: number) => void
  correctAnswer: number
}

export default function QuizQuestion({
  question,
  questionIndex,
  selectedAnswer,
  isAnswered,
  onSelectAnswer,
  correctAnswer,
}: QuizQuestionProps) {
  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-xl md:text-2xl font-heading text-foreground leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === correctAnswer
          const showResult = isAnswered

          let optionStyle = "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"

          if (showResult) {
            if (isCorrect) {
              optionStyle = "border-green-500/50 bg-green-500/10"
            } else if (isSelected && !isCorrect) {
              optionStyle = "border-red-500/50 bg-red-500/10"
            } else {
              optionStyle = "border-white/5 bg-white/5 opacity-50"
            }
          } else if (isSelected) {
            optionStyle = "border-gold/50 bg-gold/10"
          }

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectAnswer(index)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 group ${optionStyle}`}
            >
              <span className="w-8 h-8 rounded-lg border border-current flex items-center justify-center text-sm font-mono flex-shrink-0 text-foreground/40 group-hover:text-foreground/70 transition-colors">
                {String.fromCharCode(65 + index)}
              </span>

              <span className="flex-1 text-sm md:text-base font-sans text-foreground/90">
                {option}
              </span>

              {showResult && isCorrect && (
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              {showResult && isSelected && !isCorrect && (
                <X className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
            </motion.button>
          )
        })}
      </div>

      {isAnswered && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-teal/10 border border-teal/20 text-sm text-foreground/80 font-sans leading-relaxed"
        >
          <span className="text-teal font-heading text-xs uppercase tracking-wider block mb-1">
            Explanation
          </span>
          {question.explanation}
        </motion.div>
      )}
    </motion.div>
  )
}
