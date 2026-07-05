import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import type { Game } from '../../../../features/games/types'
import { GamesList } from '../../../../features/games/components/GamesList/GamesList'
import { AnalysisPanel } from '../../../../features/games/components/GamesTab/AnalysisPanel'
import { useGameAnalyze, useGames, useGamesSync } from '../../../../data/hooks/useGames'
import { usePositions } from '../../../../data/hooks/usePositions'

const searchSchema = z.object({
  result: z.enum(['win', 'loss', 'draw']).nullable().default(null).catch(null),
  color: z.enum(['white', 'black']).nullable().default(null).catch(null),
  time_class: z.enum(['bullet', 'blitz', 'rapid', 'daily']).nullable().default(null).catch(null),
  gameId: z.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_auth/games/list')({
  validateSearch: searchSchema,
  component: GamesListPage,
})

function GamesListPage() {
  const navigate = useNavigate()
  const { result, color, time_class, gameId } = useSearch({ from: '/_auth/games/list' })

  const { data: gamesData, isLoading } = useGames(result, color, time_class)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const { data: openings } = usePositions()

  const selectedGame = gamesData?.items.find(g => g.id === gameId) ?? null

  const { analyze, analyzeStatus, analyzeProgress } = useGameAnalyze(selectedGame?.id ?? null)

  const onSelect = (game: Game) =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: game.id }), replace: true })

  return (
    <div className="grid grid-cols-[300px_1fr_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        <GamesList
          gamesData={gamesData}
          isLoading={isLoading}
          selectedId={gameId ?? null}
          syncStatus={syncStatus}
          isRunning={isRunning}
          onSync={triggerSync}
          onSelect={onSelect}
        />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden" />

      <AnalysisPanel
        game={selectedGame}
        openings={openings}
        analyzeStatus={analyzeStatus}
        analyzeProgress={analyzeProgress}
        onAnalyze={analyze}
      />
    </div>
  )
}
