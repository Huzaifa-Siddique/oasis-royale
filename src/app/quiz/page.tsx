import { getAllQuizzes } from "@/lib/quiz/data"
import QuizCard from "@/components/quiz/QuizCard"

export default function QuizPage() {
  const quizzes = getAllQuizzes()

  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="flex flex-col flex-1 max-w-6xl w-full mx-auto px-4 py-12 md:py-20 z-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-heading text-gold mb-3">
            Quizzes
          </h1>
          <p className="text-foreground/60 font-sans text-base max-w-xl">
            Challenge your culinary knowledge with our curated collection of quizzes.
            From wine pairings to cooking techniques — put your expertise to the test.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      </div>
    </main>
  )
}
