import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ChessComSetup } from '../../../features/games/components/ChessComSetup'
import { useProfile } from '../../../data/hooks/useGames'

export const Route = createFileRoute('/_auth/games')({
  component: GamesLayout,
})

const TABS = [
  { label: 'Games', to: '/games/list' as const },
  { label: 'Dashboard', to: '/games/dashboard' as const },
]

function GamesLayout() {
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
      <div className="border-b border-white/10 px-4 flex gap-1 pt-2">
        {TABS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            search={(prev) => ({ modal: prev.modal })}
            activeProps={{ className: 'bg-white/10 text-white border-b-2 border-amber-400' }}
            inactiveProps={{ className: 'text-gray-400 hover:text-white hover:bg-white/5' }}
            className="px-4 py-2 text-sm font-medium rounded-t transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </main>
  )
}
