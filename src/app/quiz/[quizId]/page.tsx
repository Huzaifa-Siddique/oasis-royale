import { notFound } from "next/navigation"
import { getQuizById } from "@/lib/quiz/data"
import QuizClient from "./QuizClient"

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const quiz = getQuizById(quizId)

  if (!quiz) {
    notFound()
  }

  return <QuizClient quiz={quiz} />
}
