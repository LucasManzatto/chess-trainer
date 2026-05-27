import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'
import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { PanelSection } from '../../../../components/PanelSection'
import { GamesList } from '../../../../features/games/components/GamesList/GamesList'
import { AnalysisPanel } from '../../../../features/games/components/GamesTab/AnalysisPanel'
import { useGamesPage } from '../../../../features/games/hooks/useGamesPage'
import type { AnalyzeStatus } from '../../../../components/ChessBoard/hooks/useGameAnalysis'

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

function GamesListPage() {
  return <ChessStoreProvider><GamesListPageInner /></ChessStoreProvider>
}

function GamesListPageInner() {
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
  } = useGamesPage()

  const hasAnalysis = !!(selectedGame?.analysis) || analyzeStatus === 'done'

  return (
    <div className="grid grid-cols-[300px_1fr_220px_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
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

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          config={config}
          onFlipOrientation={flipOrientation}
          threats={threats}
          showThreatsControl
          defaultShowThreats
        />
      </section>

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
