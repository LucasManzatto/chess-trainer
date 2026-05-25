import { createFileRoute } from '@tanstack/react-router'
import { ChessComSetup } from '../../../../features/games/components/ChessComSetup'
import { GamesTab } from '../../../../features/games/components/GamesTab/GamesTab'
import { useProfile } from '../../../../features/games/hooks/useProfile'

export const Route = createFileRoute('/_auth/games/')({
  component: GamesPage,
})

function GamesPage() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <main className="flex items-center justify-center flex-1 text-gray-600 text-sm">
        Loading…
      </main>
    )
  }

  if (!profile?.chess_com_username) {
    return (
      <main className="flex flex-col flex-1">
        <ChessComSetup onComplete={() => {}} />
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <GamesTab />
    </main>
  )
}
