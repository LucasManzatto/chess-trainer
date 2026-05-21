import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/games/$gameId')({
  component: GamePage,
})

function GamePage() {
  const { gameId } = Route.useParams()
  return (
    <main className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
      <h1 className="text-2xl font-semibold text-gray-200">Game</h1>
      <p className="font-mono text-sm">{gameId}</p>
      <p>Coming soon</p>
    </main>
  )
}
