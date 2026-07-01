import type { EvaluationScore } from '../../../../lib/chess/types'

type Props = {
  score?: EvaluationScore
  isLoading: boolean
}

function whitePercent(score: EvaluationScore): number {
  if (score.type === 'mate') {
    return score.value > 0 ? 100 : 0
  }
  return 50 + 50 * Math.tanh(score.value / 400)
}

function scoreLabel(score: EvaluationScore): string {
  if (score.type === 'mate') {
    const n = Math.abs(score.value)
    return score.value > 0 ? `M${n}` : `-M${n}`
  }
  const pawns = score.value / 100
  if (pawns === 0) return '0.0'
  const formatted = Math.abs(pawns).toFixed(1)
  return pawns > 0 ? `+${formatted}` : `-${formatted}`
}

export function EvaluationBar({ score, isLoading }: Props) {
  const pct = score ? whitePercent(score) : 50
  const label = score ? scoreLabel(score) : null

  return (
    <div className="relative flex flex-col w-5 h-full shrink-0 rounded overflow-hidden select-none">
      {/* Black region (top) */}
      <div
        className="bg-gray-900 transition-all duration-300"
        style={{ height: `${100 - pct}%` }}
      />
      {/* White region (bottom) */}
      <div
        className="bg-gray-100 transition-all duration-300"
        style={{ height: `${pct}%` }}
      />

      {/* Score label */}
      {label && (
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold leading-none px-0.5"
          style={{
            bottom: pct >= 50 ? `${100 - pct}%` : undefined,
            top: pct < 50 ? `${pct}%` : undefined,
            color: pct >= 50 ? '#111' : '#eee',
          }}
        >
          {label}
        </span>
      )}

      {/* Loading pulse overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}
    </div>
  )
}
