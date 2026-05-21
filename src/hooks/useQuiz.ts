"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { Quiz, QuizQuestion, QuizResult } from "@/lib/quiz/types"

interface UseQuizReturn {
  quiz: Quiz
  currentQuestionIndex: number
  currentQuestion: QuizQuestion
  answers: (number | null)[]
  selectedAnswer: number | null
  isAnswered: boolean
  isComplete: boolean
  result: QuizResult | null
  timeRemaining: number | null
  progress: number
  selectAnswer: (index: number) => void
  nextQuestion: () => void
  previousQuestion: () => void
  restart: () => void
}

export function useQuiz(quiz: Quiz): UseQuizReturn {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(quiz.questions.length).fill(null)
  )
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [startTimes, setStartTimes] = useState<number[]>(
    () => Array(quiz.questions.length).fill(0)
  )
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimitPerQuestion ?? null
  )
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isComplete = answers.every((a) => a !== null)
  const totalQuestions = quiz.questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    if (!quiz.timeLimitPerQuestion) return

    setTimeRemaining(quiz.timeLimitPerQuestion)

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          stopTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [quiz.timeLimitPerQuestion, stopTimer])

  useEffect(() => {
    setStartTimes((prev) => {
      const next = [...prev]
      next[currentQuestionIndex] = Date.now()
      return next
    })
    setSelectedAnswer(null)
    setIsAnswered(false)

    if (quiz.timeLimitPerQuestion) {
      startTimer()
    }

    return () => stopTimer()
  }, [currentQuestionIndex, quiz.timeLimitPerQuestion, startTimer, stopTimer])

  useEffect(() => {
    if (timeRemaining === 0 && !isAnswered) {
      setIsAnswered(true)
    }
  }, [timeRemaining, isAnswered])

  const timePerQuestion = startTimes.map((start, i) => {
    if (start === 0) return 0
    return i < answers.length && answers[i] !== null
      ? (Date.now() - start) / 1000
      : 0
  })

  const result: QuizResult | null = isComplete
    ? {
        quizId: quiz.id,
        score: answers.reduce(
          (acc, answer, i) =>
            acc + (answer === quiz.questions[i].correctAnswer ? 1 : 0),
          0
        ),
        totalQuestions: quiz.questions.length,
        answers,
        completedAt: new Date(),
        timePerQuestion,
      }
    : null

  const selectAnswer = useCallback(
    (index: number) => {
      if (isAnswered) return
      stopTimer()
      setSelectedAnswer(index)
      setIsAnswered(true)
      setAnswers((prev) => {
        const next = [...prev]
        next[currentQuestionIndex] = index
        return next
      })
    },
    [isAnswered, currentQuestionIndex, stopTimer]
  )

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }, [currentQuestionIndex, totalQuestions])

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }, [currentQuestionIndex])

  const restart = useCallback(() => {
    stopTimer()
    setCurrentQuestionIndex(0)
    setAnswers(Array(quiz.questions.length).fill(null))
    setSelectedAnswer(null)
    setIsAnswered(false)
    setStartTimes(Array(quiz.questions.length).fill(0))
    setTimeRemaining(quiz.timeLimitPerQuestion ?? null)
  }, [quiz.questions.length, quiz.timeLimitPerQuestion, stopTimer])

  return {
    quiz,
    currentQuestionIndex,
    currentQuestion,
    answers,
    selectedAnswer,
    isAnswered,
    isComplete,
    result,
    timeRemaining,
    progress,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    restart,
  }
}
