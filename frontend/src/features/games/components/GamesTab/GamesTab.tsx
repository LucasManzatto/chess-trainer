import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { PanelSection } from '../../../../components/PanelSection'
import { useGamesTab } from '../../hooks/useGamesTab'
import { GamesList } from '../GamesList/GamesList'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'

export function GamesTab() {
  return <ChessStoreProvider><GamesTabInner /></ChessStoreProvider>
}

function GamesTabInner() {
  const {
    username,
    games,
    gamesTotal,
    gamesLoading,
    selectedGame,
    selectGame,
    filters,
    setResult,
    setColor,
    setTimeClass,
    syncStatus,
    isRunning,
    triggerSync,
    config,
    allMoves,
    selectedMoveIndex,
    threats,
    flipOrientation,
    onMoveClick,
    analyze,
    analyzeStatus,
    analyzeProgress,
    moveClassifications,
    openingMoveCount,
  } = useGamesTab()

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
          syncStatus={syncStatus}
          isRunning={isRunning}
          onSelect={selectGame}
          onResultChange={setResult}
          onColorChange={setColor}
          onTimeClassChange={setTimeClass}
          onSync={triggerSync}
        />
      </section>

      {/* Col 2: Board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          config={config}
          onFlipOrientation={flipOrientation}
          threats={threats}
          showThreatsControl
          defaultShowThreats
          title={
            selectedGame ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-sm text-gray-400 truncate">
                  {selectedGame.white_username} vs {selectedGame.black_username}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {analyzeStatus === 'running' ? (
                    <span className="text-xs text-gray-400">
                      {analyzeProgress.current} / {analyzeProgress.total}
                    </span>
                  ) : null}
                  <button
                    onClick={analyze}
                    disabled={analyzeStatus === 'running'}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      analyzeStatus === 'running'
                        ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
                    }`}
                  >
                    {analyzeStatus === 'running'
                      ? 'Analyzing…'
                      : (selectedGame.analysis || analyzeStatus === 'done')
                        ? 'Re-analyze'
                        : 'Analyze'}
                  </button>
                </div>
              </div>
            ) : undefined
          }
        />
      </section>

      {/* Col 3: Move list */}
      <PanelSection title="Moves">
        <div className="flex-1 min-h-0 overflow-hidden">
          <MoveList
            moves={allMoves}
            selectedIndex={selectedMoveIndex < allMoves.length ? selectedMoveIndex : null}
            onMoveClick={onMoveClick}
            showHeader={false}
            moveClassifications={moveClassifications}
            openingMoveCount={openingMoveCount}
          />
        </div>
      </PanelSection>

      {/* Col 4: Analysis placeholder */}
      <PanelSection title="Analysis">
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
          Engine analysis coming soon
        </div>
      </PanelSection>
    </div>
  )
}
