import { AccuracyBar } from './AccuracyBar'
import { WinProbabilityCurve } from './WinProbabilityCurve'
import { MoveQualityTable } from './MoveQualityTable'
import { CriticalMomentsList } from './CriticalMomentsList'
import { computeWinPercentTimeline, countClassifications, findCriticalMoves } from '../../utils/analysisUtils'
import { PanelSection } from '../../../../components/ui/PanelSection'
import type { Game } from '../../types'

type AnalysisPanelProps = {
  game: Game | null
}

export function AnalysisPanel({ game }: AnalysisPanelProps) {
  if (!game) {
    return (
      <PanelSection title="Analysis">
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
          Select a game to begin
        </div>
      </PanelSection>
    )
  }

  const effectiveAnalysis = game.analysis
  const criticalMoveIndices = effectiveAnalysis
    ? findCriticalMoves(effectiveAnalysis.moves, effectiveAnalysis.initial_score ?? 0, game.user_color)
    : []
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
    <PanelSection title="Analysis">
      <div className="flex-1 overflow-y-auto min-h-0">
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
              onMoveClick={() => {}}
            />
          </>
        )}
      </div>
    </PanelSection>
  )
}
