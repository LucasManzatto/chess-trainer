import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/puzzles/$puzzleId')({
  component: PuzzlePage,
})

function PuzzlePage() {
  const { puzzleId } = Route.useParams()
  return (
    <main className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
      <h1 className="text-2xl font-semibold text-gray-200">Puzzle</h1>
      <p className="font-mono text-sm">{puzzleId}</p>
      <p>Coming soon</p>
    </main>
  )
}
