import { useEffect } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useShallow } from 'zustand/shallow'
import { GamesListHeader, GameList } from '../../../../features/games/components/GamesList/GamesList'
import { AnalysisPanel } from '../../../../features/games/components/GamesTab/AnalysisPanel'
import { SyncControls } from '../../../../features/games/components/GamesTab/SyncControls'
import { useAnalyzeAllGames, useGameAnalyze, useGames, useGamesSync } from '../../../../data/hooks/useGames'
import { ChessBoardProvider, ChessBoard, useChessBoardStore, getCurrentFen, getCurrentLan, getMoves, getActiveMove } from '../../../../features/board'
import { useBoardSettings } from '../../../../stores/board/boardSettingsStore'
import { MovesList } from '../../../../components/MovesList/MovesList'

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
  return (
    <ChessBoardProvider config={{ interactive: false }}>
      <GamesListPageInner />
    </ChessBoardProvider>
  )
}

function GamesListPageInner() {
  const navigate = useNavigate()
  const { result, color, time_class, gameId } = useSearch({ from: '/_auth/games/list' })

  const { data: gamesData, isLoading } = useGames(result, color, time_class)
  const selectedGame = gamesData?.items.find(g => g.id === gameId) ?? null

  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const { analyzeAll, isRunning: isAnalyzingAll, progress: analyzeAllProgress, pendingCount } = useAnalyzeAllGames(gamesData?.items)
  const { analyze, analyzeStatus, analyzeProgress } = useGameAnalyze(selectedGame?.id ?? null)

  const onSelect = (selectedId: number) =>
    navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, gameId: selectedId }), replace: true })

  const boardState = useChessBoardStore(
    useShallow(s => ({
      fen: getCurrentFen(s),
      orientation: s.orientation,
      interactive: s.interactive,
      lastMove: getCurrentLan(s),
      moves: getMoves(s),
      activeMove: getActiveMove(s),
      applyMove: s.applyMove,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
      navigateToIndex: s.navigateToIndex,
      loadMoves: s.loadMoves,
      setOrientation: s.setOrientation,
      setInteractive: s.setInteractive,
    })),
  )
  const boardSize = useBoardSettings(s => s.boardSize)
  const showBestMove = useBoardSettings(s => s.showBestMove)

  useEffect(() => {
    if (!selectedGame) return
    boardState.loadMoves(selectedGame.moves)
    boardState.setOrientation(selectedGame.user_color)
    boardState.setInteractive(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame?.id])

  return (
    <div className="grid grid-cols-[300px_1fr_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Loading…
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-3 pt-2 flex justify-end">
              <SyncControls
                isRunning={isRunning}
                syncStatus={syncStatus}
                onSync={triggerSync}
                isAnalyzingAll={isAnalyzingAll}
                analyzeAllProgress={analyzeAllProgress}
                pendingAnalyzeCount={pendingCount}
                onAnalyzeAll={analyzeAll}
              />
            </div>
            <GamesListHeader total={gamesData?.total ?? 0} />
            <GameList
              games={gamesData?.items ?? []}
              isSelected={id => id === gameId}
              analyzeStatus={analyzeStatus}
              analyzeProgress={analyzeProgress}
              onSelect={onSelect}
              onAnalyze={analyze}
            />
          </div>
        )}
      </section>

      <section className="flex items-center justify-center gap-5 min-h-0 overflow-hidden">
        {selectedGame ? (
          <>
            <ChessBoard
              state={boardState}
              arrows={[]}
              circles={[]}
              config={{ showBestMove, boardSize }}
              actions={{
                applyMove: boardState.applyMove,
                navigateBack: boardState.navigateBack,
                navigateForward: boardState.navigateForward,
              }}
            />
            <div className="w-56" style={{ height: boardSize }}>
              <MovesList
                moves={boardState.moves}
                activeMove={boardState.activeMove}
                onMoveClick={(moveNumber, color) =>
                  boardState.navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
                }
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-white/25">Select a game to view the board</p>
        )}
      </section>

      <AnalysisPanel game={selectedGame} />
    </div>
  )
}
