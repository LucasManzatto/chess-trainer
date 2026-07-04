import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import type { Game, GameAnalysis } from '../../../../features/games/types'
import { GamesList } from '../../../../features/games/components/GamesList/GamesList'
import { AnalysisPanel } from '../../../../features/games/components/GamesTab/AnalysisPanel'
import { useGames, useGamesSync, useSaveGameAnalysis } from '../../../../data/hooks/useGames'
import { usePositions } from '../../../../data/hooks/usePositions'
import { useGameAnalysis } from '../../../../features/board/hooks/useGameAnalysis'

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

  const { data: gamesData, isLoading, invalidate: invalidateGames } = useGames(result, color, time_class)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const { data: openings } = usePositions()

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const { mutateAsync: saveAnalysis } = useSaveGameAnalysis()
  const onAnalyzed = (gameId: number, result: GameAnalysis) => {
    saveAnalysis({ gameId, analysis: result })
    invalidateGames()
  }
  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(selectedGame, 18, onAnalyzed)

  const onSelect = (game: Game) =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: game.id }), replace: true })

  const onGameNotFound = () =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: undefined }), replace: true })

  const autoSelectedRef = useRef<number | null>(null)

  useEffect(() => {
    if (!gameId || isLoading) return
    if (autoSelectedRef.current === gameId) return

    const game = gamesData?.items.find(g => g.id === gameId)
    if (game) {
      autoSelectedRef.current = gameId
      setSelectedGame(game)
    } else {
      onGameNotFound()
    }
  }, [gameId, gamesData, isLoading, onGameNotFound])

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
        analysis={analysis}
        openings={openings}
        analyzeStatus={analyzeStatus}
        analyzeProgress={analyzeProgress}
        onAnalyze={analyze}
      />
    </div>
  )
}
