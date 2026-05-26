import { Link } from '@tanstack/react-router'
import type { Game, GameAnalysis } from '../../types'
import type { OpeningMatch } from '../../utils/gameLogic'
import { AccuracyBar } from './AccuracyBar'
import { WinProbabilityCurve } from './WinProbabilityCurve'
import { MoveQualityTable } from './MoveQualityTable'
import { CriticalMomentsList } from './CriticalMomentsList'
import { computeWinPercentTimeline, countClassifications } from '../../utils/analysisUtils'

type OpeningSectionProps = {
  openingMatch: OpeningMatch | null
  openingName: string
}

function OpeningSection({ openingMatch, openingName }: OpeningSectionProps) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      {openingMatch ? (
        <Link
          to="/openings"
          search={{ tab: 'browse', openingId: openingMatch.opening.id, modal: undefined }}
          className="flex items-center gap-1.5 group"
        >
          <p className="text-xs text-gray-300 leading-snug group-hover:text-white transition-colors flex-1 min-w-0 truncate">
            {openingMatch.opening.name}
          </p>
          <span className="text-[10px] text-amber-500/50 flex-shrink-0 group-hover:text-amber-400 transition-colors">→ View</span>
        </Link>
      ) : (
        <div>
          <span className="text-[10px] text-orange-400/70">not in library</span>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">{openingName}</p>
        </div>
      )}
    </div>
  )
}

type AnalysisPanelProps = {
  game: Game | null
  analysis: GameAnalysis | null
  criticalMoveIndices: number[]
  openingMatch: OpeningMatch | null
  onMoveClick: (index: number) => void
}

export function AnalysisPanel({
  game,
  analysis,
  criticalMoveIndices,
  openingMatch,
  onMoveClick,
}: AnalysisPanelProps) {
  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
        Select a game to begin
      </div>
    )
  }

  const hasEco = !!(game.eco || game.opening_name)
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
      {hasEco && (
        <OpeningSection
          openingMatch={openingMatch}
          openingName={game.opening_name ?? game.eco ?? ''}
        />
      )}
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
