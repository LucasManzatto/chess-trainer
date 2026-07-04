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
  eco: z.string().default('').catch(''),
  gameId: z.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_auth/games/list')({
  validateSearch: searchSchema,
  component: GamesListPage,
})

function GamesListPage() {
  const navigate = useNavigate()
  const { result, color, time_class, eco, gameId } = useSearch({ from: '/_auth/games/list' })

  const listFilters = { result, color, time_class, eco: '' }
  const analysisFilters = { result, color, time_class, eco }

  const { data: gamesData, isLoading } = useGames(listFilters)
  const { data: analysisGamesData, isLoading: analysisGamesLoading, invalidate: invalidateAnalysisGames } = useGames(analysisFilters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const { data: openings } = usePositions()
  const games = gamesData?.items ?? []
  const total = gamesData?.total ?? 0
  const analysisGames = analysisGamesData?.items ?? []

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const { mutateAsync: saveGameAnalysis } = useSaveGameAnalysis()
  const saveAnalysis = (gameId: number, analysis: GameAnalysis) => saveGameAnalysis({ gameId, analysis })
  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(selectedGame, saveAnalysis, 18, invalidateAnalysisGames)

  const onSelect = (game: Game) =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: game.id }), replace: true })

  const onGameNotFound = () =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: undefined }), replace: true })

  const autoSelectedRef = useRef<number | null>(null)

  useEffect(() => {
    if (!gameId || analysisGamesLoading) return
    if (autoSelectedRef.current === gameId) return

    const game = analysisGames.find(g => g.id === gameId)
    if (game) {
      autoSelectedRef.current = gameId
      setSelectedGame(game)
    } else {
      onGameNotFound()
    }
  }, [gameId, analysisGames, analysisGamesLoading, onGameNotFound])

  return (
    <div className="grid grid-cols-[300px_1fr_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        <GamesList
          games={games}
          isLoading={isLoading}
          total={total}
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
