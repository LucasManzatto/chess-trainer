import type { Game } from '../../types'
import type { AnalyzeStatus } from '../../../../components/ChessBoard/hooks/useGameAnalysis'
import { formatDate } from '../../utils/gameFormatters'

type GameSummaryCardProps = {
  game: Game
  onAnalyze: () => void
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
}

export function GameSummaryCard({ game, onAnalyze, analyzeStatus, analyzeProgress }: GameSummaryCardProps) {
  const opponent = game.user_color === 'white' ? game.black_username : game.white_username
  const opponentRating = game.user_color === 'white' ? game.black_rating : game.white_rating

  const resultColor = { win: 'text-green-400', loss: 'text-red-400', draw: 'text-gray-400' }[game.result]
  const resultLabel = { win: 'Win', loss: 'Loss', draw: 'Draw' }[game.result]
  const hasAnalysis = !!game.analysis || analyzeStatus === 'done'

  return (
    <div className="p-3 border-b border-white/[0.06]">
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-sm font-medium text-gray-200 truncate">{opponent}</span>
        {opponentRating && (
          <span className="text-xs text-gray-500 flex-shrink-0">({opponentRating})</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 flex-wrap">
        <span className={resultColor}>{resultLabel}</span>
        {game.time_class && <><span>·</span><span className="capitalize">{game.time_class}</span></>}
        {game.played_at && <><span>·</span><span>{formatDate(game.played_at)}</span></>}
      </div>
      {game.opening_name && (
        <div className="text-xs text-gray-500 mb-2 truncate">
          {game.eco && <span className="text-amber-500/70 mr-1">{game.eco}</span>}
          {game.opening_name}
        </div>
      )}
      <div className="flex items-center gap-2">
        {analyzeStatus === 'running' && (
          <span className="text-xs text-gray-500">
            {analyzeProgress.current}/{analyzeProgress.total}
          </span>
        )}
        <button
          onClick={onAnalyze}
          disabled={analyzeStatus === 'running'}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            analyzeStatus === 'running'
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
          }`}
        >
          {analyzeStatus === 'running' ? 'Analyzing…' : hasAnalysis ? 'Re-analyze' : 'Analyze'}
        </button>
      </div>
    </div>
  )
}
