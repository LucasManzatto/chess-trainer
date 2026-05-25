import { ChessBoard } from '../../../../components/ChessBoard/ChessBoard'
import { useBoardSettingsStore } from '../../../../stores/useBoardSettingsStore'
import { EvaluationBar } from '../../../evaluation/components/EvaluationBar'
import { usePositionEvaluation } from '../../../evaluation/hooks/usePositionEvaluation'
import { MoveList } from '../../../openings/components/BrowseTab/MoveList'
import { GamesList } from '../GamesList/GamesList'
import { useGamesTab } from '../../hooks/useGamesTab'

const EVAL_BAR_WIDTH = 16

export function GamesTab() {
  const {
    profile,
    games,
    gamesTotal,
    gamesLoading,
    selectedGame,
    selectGame,
    filters,
    setResult,
    setColor,
    setTimeClass,
    setEco,
    syncStatus,
    isRunning,
    triggerSync,
    moves,
    selectedMoveIndex,
    currentFen,
    boardOrientation,
    onMoveClick,
  } = useGamesTab()

  const { score, isLoading: evalLoading } = usePositionEvaluation(currentFen)
  const { size: boardSize } = useBoardSettingsStore()

  const username = profile?.chess_com_username ?? ''

  return (
    <div className="grid grid-cols-[300px_1fr_220px_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      {/* Col 1: Games list */}
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        <GamesList
          games={games}
          isLoading={gamesLoading}
          selectedId={selectedGame?.id ?? null}
          username={username}
          filters={filters}
          total={gamesTotal}
          onSelect={selectGame}
          onResultChange={setResult}
          onColorChange={setColor}
          onTimeClassChange={setTimeClass}
          onEcoChange={setEco}
        />
      </section>

      {/* Col 2: Board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden gap-3">
        {/* Header: sync controls */}
        <div style={{ width: EVAL_BAR_WIDTH + 8 + boardSize }} className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="text-sm text-gray-400 truncate">
            {selectedGame
              ? `${selectedGame.white_username} vs ${selectedGame.black_username}`
              : ''}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isRunning && syncStatus && (
              <span className="text-xs text-gray-500">
                {syncStatus.current_month ?? 0}/{syncStatus.total_months ?? '?'} months
                {syncStatus.games_added != null ? ` · ${syncStatus.games_added} games` : ''}
              </span>
            )}
            <button
              onClick={triggerSync}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Syncing…' : 'Sync'}
            </button>
          </div>
        </div>

        {/* Board assembly */}
        <div className="flex flex-row gap-2 flex-shrink-0" style={{ height: boardSize }}>
          <EvaluationBar score={score} isLoading={evalLoading} />
          <div style={{ width: boardSize, height: boardSize, flexShrink: 0 }}>
            {selectedGame ? (
              <ChessBoard
                boardWidth={boardSize}
                position={currentFen}
                orientation={boardOrientation}
                interactive={false}
                lastMove={
                  selectedMoveIndex != null && moves[selectedMoveIndex]
                    ? [moves[selectedMoveIndex].from as never, moves[selectedMoveIndex].to as never]
                    : undefined
                }
              />
            ) : (
              <div
                className="flex items-center justify-center bg-white/[0.02] border border-white/[0.06] text-gray-600 text-sm text-center"
                style={{ width: boardSize, height: boardSize }}
              >
                Select a game to replay
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Col 3: Move list */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="px-3 h-10 flex items-center border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moves</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MoveList
            moves={moves.map(m => m.san)}
            moveIndex={selectedMoveIndex < moves.length ? selectedMoveIndex : null}
            onMoveClick={onMoveClick}
          />
        </div>
      </section>

      {/* Col 4: Analysis placeholder */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="px-3 h-10 flex items-center border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Analysis</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
          Engine analysis coming soon
        </div>
      </section>
    </div>
  )
}
