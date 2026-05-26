import type { Game, GameAnalysis } from '../../types'
import type { AnalyzeStatus } from '../../../../components/ChessBoard/hooks/useGameAnalysis'
import { GameSummaryCard } from './GameSummaryCard'
import { AccuracyBar } from './AccuracyBar'
import { WinProbabilityCurve } from './WinProbabilityCurve'
import { MoveQualityTable } from './MoveQualityTable'
import { CriticalMomentsList } from './CriticalMomentsList'
import { computeWinPercentTimeline, countClassifications } from '../../utils/analysisUtils'

type AnalysisPanelProps = {
  game: Game | null
  analysis: GameAnalysis | null
  criticalMoveIndices: number[]
  onMoveClick: (index: number) => void
  onAnalyze: () => void
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
}

export function AnalysisPanel({
  game,
  analysis,
  criticalMoveIndices,
  onMoveClick,
  onAnalyze,
  analyzeStatus,
  analyzeProgress,
}: AnalysisPanelProps) {
  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
        Select a game to begin
      </div>
    )
  }

  const effectiveAnalysis = analysis ?? game.analysis
  const timeline = effectiveAnalysis
    ? computeWinPercentTimeline(
        effectiveAnalysis.initial_score ?? 0,
        effectiveAnalysis.moves.map(m => m.score ?? 0),
      )
    : null
  const counts = effectiveAnalysis
    ? countClassifications(effectiveAnalysis.moves, game.user_color)
    : null

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <GameSummaryCard
        game={game}
        onAnalyze={onAnalyze}
        analyzeStatus={analyzeStatus}
        analyzeProgress={analyzeProgress}
      />
      {effectiveAnalysis && timeline && counts && (
        <>
          <AccuracyBar
            whiteAccuracy={effectiveAnalysis.white_accuracy}
            blackAccuracy={effectiveAnalysis.black_accuracy}
            userColor={game.user_color}
          />
          <WinProbabilityCurve
            timeline={timeline}
            criticalMoveIndices={criticalMoveIndices}
          />
          <MoveQualityTable
            userCounts={counts.user}
            opponentCounts={counts.opponent}
          />
          <CriticalMomentsList
            moves={effectiveAnalysis.moves}
            criticalMoveIndices={criticalMoveIndices}
            timeline={timeline}
            userColor={game.user_color}
            onMoveClick={onMoveClick}
          />
        </>
      )}
    </div>
  )
}
