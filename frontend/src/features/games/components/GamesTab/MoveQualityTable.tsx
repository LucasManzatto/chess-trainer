import type { MoveClassification } from '../../../../lib/chess/types'

const ORDER: MoveClassification[] = ['blunder', 'mistake', 'inaccuracy', 'good', 'excellent', 'best']

const LABELS: Record<MoveClassification, string> = {
  blunder: 'Blunder',
  mistake: 'Mistake',
  inaccuracy: 'Inaccuracy',
  good: 'Good',
  excellent: 'Excellent',
  best: 'Best',
}

const COLORS: Record<MoveClassification, string> = {
  best: 'text-blue-400',
  excellent: 'text-emerald-400',
  good: 'text-gray-400',
  inaccuracy: 'text-yellow-400',
  mistake: 'text-orange-400',
  blunder: 'text-red-400',
}

type MoveQualityTableProps = {
  userCounts: Record<MoveClassification, number>
  opponentCounts: Record<MoveClassification, number>
}

export function MoveQualityTable({ userCounts, opponentCounts }: MoveQualityTableProps) {
  const rows = ORDER.filter(cls => userCounts[cls] > 0 || opponentCounts[cls] > 0)
  if (rows.length === 0) return null

  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Moves</span>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-normal pb-1 text-gray-600"></th>
            <th className="text-right font-normal pb-1 text-gray-500 w-8">You</th>
            <th className="text-right font-normal pb-1 text-gray-600 w-8">Opp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(cls => (
            <tr key={cls}>
              <td className={`${COLORS[cls]} py-0.5`}>{LABELS[cls]}</td>
              <td className="text-right text-gray-300 tabular-nums">{userCounts[cls]}</td>
              <td className="text-right text-gray-500 tabular-nums">{opponentCounts[cls]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
