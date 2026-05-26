import type { MoveAnalysis } from '../../../../components/ChessBoard/types'

type CriticalMomentsListProps = {
  moves: MoveAnalysis[]
  criticalMoveIndices: number[]
  timeline: number[]
  userColor: 'white' | 'black'
  onMoveClick: (index: number) => void
}

export function CriticalMomentsList({ moves, criticalMoveIndices, timeline, userColor, onMoveClick }: CriticalMomentsListProps) {
  if (criticalMoveIndices.length === 0) return null

  const userIsWhite = userColor === 'white'

  return (
    <div className="px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
        Critical moments
      </span>
      <div className="flex flex-col gap-0.5">
        {criticalMoveIndices.map(idx => {
          const move = moves[idx]
          const moveNum = Math.floor(idx / 2) + 1
          const isWhiteMove = idx % 2 === 0
          const prefix = isWhiteMove ? `${moveNum}.` : `${moveNum}…`

          const winBefore = userIsWhite ? timeline[idx] : 100 - timeline[idx]
          const winAfter = userIsWhite ? timeline[idx + 1] : 100 - timeline[idx + 1]
          const drop = Math.round(winBefore - winAfter)

          return (
            <button
              key={idx}
              onClick={() => onMoveClick(idx)}
              className="text-left flex items-center gap-1.5 hover:bg-white/[0.04] rounded px-1 py-1 -mx-1 transition-colors"
            >
              <span className="text-xs text-gray-600 w-10 flex-shrink-0">{prefix}</span>
              <span className="text-xs font-mono text-gray-200 flex-1 min-w-0 truncate">
                {move?.san || '—'}
              </span>
              <span className="text-xs text-red-400 flex-shrink-0 tabular-nums">−{drop}%</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
