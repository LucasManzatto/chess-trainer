import { useState } from 'react'
import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { PanelSection } from '../../../../components/PanelSection'
import { useGamesTab } from '../../hooks/useGamesTab'
import { GamesList } from '../GamesList/GamesList'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'
import { AnalysisPanel } from './AnalysisPanel'
import type { AnalyzeStatus } from '../../../../components/ChessBoard/hooks/useGameAnalysis'

type AnalysisHeaderProps = {
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
  hasAnalysis: boolean
  onAnalyze: () => void
}

function AnalysisHeader({ analyzeStatus, analyzeProgress, hasAnalysis, onAnalyze }: AnalysisHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {analyzeStatus === 'running' && (
        <span className="text-xs text-gray-500">
          {analyzeProgress.current}/{analyzeProgress.total}
        </span>
      )}
      <button
        onClick={onAnalyze}
        disabled={analyzeStatus === 'running'}
        className={`text-xs px-2 py-0.5 rounded transition-colors ${
          analyzeStatus === 'running'
            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
            : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
        }`}
      >
        {analyzeStatus === 'running' ? 'Analyzing…' : hasAnalysis ? 'Re-analyze' : 'Analyze'}
      </button>
    </div>
  )
}

export function GamesTab() {
  return <ChessStoreProvider><GamesTabInner /></ChessStoreProvider>
}

function GamesTabInner() {
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
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
    openingMatch,
    openingMoveCount,
    criticalMoveIndices,
  } = useGamesTab()

  const hasAnalysis = !!(selectedGame?.analysis) || analyzeStatus === 'done'

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
        />
      </section>

      {/* Col 3: Move list */}
      <PanelSection
        title="Moves"
        headerAction={
          criticalMoveIndices.length > 0 ? (
            <button
              onClick={() => setShowCriticalOnly(v => !v)}
              className={`text-xs transition-colors ${showCriticalOnly ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {showCriticalOnly ? 'Critical only' : 'All moves'}
            </button>
          ) : null
        }
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <MoveList
            moves={allMoves}
            selectedIndex={selectedMoveIndex < allMoves.length ? selectedMoveIndex : null}
            onMoveClick={onMoveClick}
            showHeader={false}
            moveClassifications={moveClassifications}
            openingMoveCount={openingMoveCount}
            criticalMoveIndices={criticalMoveIndices}
            showCriticalOnly={showCriticalOnly}
          />
        </div>
      </PanelSection>

      {/* Col 4: Analysis */}
      <PanelSection
        title="Analysis"
        headerAction={
          selectedGame ? (
            <AnalysisHeader
              analyzeStatus={analyzeStatus}
              analyzeProgress={analyzeProgress}
              hasAnalysis={hasAnalysis}
              onAnalyze={analyze}
            />
          ) : null
        }
      >
        <AnalysisPanel
          game={selectedGame}
          analysis={analysis}
          criticalMoveIndices={criticalMoveIndices}
          openingMatch={openingMatch}
          onMoveClick={onMoveClick}
        />
      </PanelSection>
    </div>
  )
}
