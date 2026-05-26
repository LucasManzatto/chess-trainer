import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { ChessComSetup } from '../../../../features/games/components/ChessComSetup'
import { GamesTab } from '../../../../features/games/components/GamesTab/GamesTab'
import { useProfile } from '../../../../features/games/hooks/useProfile'

const searchSchema = z.object({
  tab: z.enum(['games', 'dashboard']).default('games').catch('games'),
  result: z.enum(['win', 'loss', 'draw']).nullable().default(null).catch(null),
  color: z.enum(['white', 'black']).nullable().default(null).catch(null),
  time_class: z.enum(['bullet', 'blitz', 'rapid', 'daily']).nullable().default(null).catch(null),
  eco: z.string().default('').catch(''),
  gameId: z.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_auth/games/')({
  validateSearch: searchSchema,
  component: GamesPage,
})

type Tab = 'games' | 'dashboard'

const TABS: { id: Tab; label: string }[] = [
  { id: 'games', label: 'Games' },
  { id: 'dashboard', label: 'Dashboard' },
]

function GamesPage() {
  const { tab } = useSearch({ from: '/_auth/games/' })
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()

  function setTab(t: Tab) {
    navigate({ to: '/games', search: (prev) => ({ ...prev, tab: t }), replace: true })
  }

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
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === id
                ? 'bg-white/10 text-white border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'games' && <GamesTab />}
        {tab === 'dashboard' && (
          <div className="flex flex-col items-center justify-center flex-1 h-full gap-2 text-gray-400">
            <h1 className="text-2xl font-semibold text-gray-200">Dashboard</h1>
            <p>Coming soon</p>
          </div>
        )}
      </div>
    </main>
  )
}
