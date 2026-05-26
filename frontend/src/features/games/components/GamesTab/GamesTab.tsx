import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { PanelSection } from '../../../../components/PanelSection'
import { useGamesTab } from '../../hooks/useGamesTab'
import { GamesList } from '../GamesList/GamesList'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'
import { AnalysisPanel } from './AnalysisPanel'

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
    analysis,
    moveClassifications,
    openingMoveCount,
    criticalMoveIndices,
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
              <span className="text-sm text-gray-400 truncate">
                {selectedGame.white_username} vs {selectedGame.black_username}
              </span>
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
            criticalMoveIndices={criticalMoveIndices}
          />
        </div>
      </PanelSection>

      {/* Col 4: Analysis */}
      <PanelSection title="Analysis">
        <AnalysisPanel
          game={selectedGame}
          analysis={analysis}
          criticalMoveIndices={criticalMoveIndices}
          onMoveClick={onMoveClick}
          onAnalyze={analyze}
          analyzeStatus={analyzeStatus}
          analyzeProgress={analyzeProgress}
        />
      </PanelSection>
    </div>
  )
}
