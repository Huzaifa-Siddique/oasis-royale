"use client"

import { AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import Link from "next/link"
import type { Quiz } from "@/lib/quiz/types"
import { useQuiz } from "@/hooks/useQuiz"
import QuizProgress from "@/components/quiz/QuizProgress"
import QuizQuestion from "@/components/quiz/QuizQuestion"
import QuizResult from "@/components/quiz/QuizResult"

export default function QuizClient({ quiz }: { quiz: Quiz }) {
  const {
    currentQuestionIndex,
    currentQuestion,
    answers,
    selectedAnswer,
    isAnswered,
    isComplete,
    result,
    timeRemaining,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    restart,
  } = useQuiz(quiz)

  if (isComplete && result) {
    return (
      <main className="flex flex-col min-h-screen relative overflow-hidden">
        <div className="flex flex-col flex-1 items-center justify-center px-4 py-12 z-10">
          <QuizResult quiz={quiz} result={result} onRestart={restart} />
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="flex flex-col flex-1 max-w-2xl w-full mx-auto px-4 py-8 md:py-16 z-10">
        <QuizProgress
          current={currentQuestionIndex}
          total={quiz.questions.length}
          answers={answers}
          timeRemaining={timeRemaining}
          onNavigate={(i) => {
            if (i < currentQuestionIndex || isAnswered) {
              while (currentQuestionIndex > i) previousQuestion()
              while (currentQuestionIndex < i) nextQuestion()
            }
          }}
        />

        <div className="flex-1 mt-8">
          <AnimatePresence mode="wait">
            <QuizQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              selectedAnswer={selectedAnswer}
              isAnswered={isAnswered}
              onSelectAnswer={selectAnswer}
              correctAnswer={currentQuestion.correctAnswer}
            />
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <div>
            {currentQuestionIndex > 0 ? (
              <button
                onClick={previousQuestion}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-foreground/60 font-sans text-sm hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <Link
                href="/quiz"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-foreground/60 font-sans text-sm hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Quizzes
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAnswered && currentQuestionIndex < quiz.questions.length - 1 && (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold font-heading text-sm hover:bg-gold/20 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {isAnswered && currentQuestionIndex === quiz.questions.length - 1 && (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-background font-heading text-sm hover:bg-amber-300 transition-colors"
              >
                View Results
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
