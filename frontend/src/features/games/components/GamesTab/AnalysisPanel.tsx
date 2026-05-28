import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AccuracyBar } from './AccuracyBar'
import { WinProbabilityCurve } from './WinProbabilityCurve'
import { MoveQualityTable } from './MoveQualityTable'
import { CriticalMomentsList } from './CriticalMomentsList'
import { computeWinPercentTimeline, countClassifications } from '../../utils/analysisUtils'
import { PanelSection } from '../../../../components/PanelSection'
import { useGames } from '../../hooks/useGames'
import { useGameBoard } from '../../hooks/useGameBoard'
import { gamesKeys } from '../../api/queryKeys'
import type { GamesFilters } from '../../types'
import type { OpeningMatch } from '../../utils/gameLogic'
import type { AnalyzeStatus } from '../../../../features/board/hooks/useGameAnalysis'

type OpeningSectionProps = {
  openingMatch: OpeningMatch | null
  openingName: string
}

function OpeningSection({ openingMatch, openingName }: OpeningSectionProps) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      {openingMatch ? (
        <Link
          to="/openings/browse"
          search={{ modal: undefined }}
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

export function AnalysisPanel({ onOrientationChange }: { onOrientationChange?: (o: 'white' | 'black') => void }) {
  const navigate = useNavigate()
  const { result, color, time_class, eco, gameId } = useSearch({ from: '/_auth/games/list' })

  const filters: GamesFilters = useMemo(
    () => ({ result, color, time_class, eco }),
    [result, color, time_class, eco],
  )

  const queryClient = useQueryClient()
  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)

  const onAnalysisComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gamesKeys.list(filters) })
  }, [queryClient, filters])

  const board = useGameBoard(onAnalysisComplete, onOrientationChange)

  const autoSelectedRef = useRef<number | null>(null)
  const games = gamesData?.items ?? []

  useEffect(() => {
    if (!gameId || gamesLoading) return
    if (autoSelectedRef.current === gameId) return

    const game = games.find(g => g.id === gameId)
    if (game) {
      autoSelectedRef.current = gameId
      board.selectGame(game)
    } else {
      navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, gameId: undefined }), replace: true })
    }
  }, [gameId, games, gamesLoading, board.selectGame, navigate])

  const game = board.selectedGame
  const { analysis, criticalMoveIndices, openingMatch, analyzeStatus, analyzeProgress, analyze: onAnalyze } = board
  const hasAnalysis = !!(game?.analysis) || analyzeStatus === 'done'
  const headerAction = game ? (
    <AnalysisHeader
      analyzeStatus={analyzeStatus}
      analyzeProgress={analyzeProgress}
      hasAnalysis={hasAnalysis}
      onAnalyze={onAnalyze}
    />
  ) : null

  if (!game) {
    return (
      <PanelSection title="Analysis">
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
          Select a game to begin
        </div>
      </PanelSection>
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
    <PanelSection title="Analysis" headerAction={headerAction}>
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
              onMoveClick={() => {}}
            />
          </>
        )}
      </div>
    </PanelSection>
  )
}
