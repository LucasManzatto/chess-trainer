type AccuracyBarProps = {
  whiteAccuracy: number
  blackAccuracy: number
  userColor: 'white' | 'black'
}

export function AccuracyBar({ whiteAccuracy, blackAccuracy, userColor }: AccuracyBarProps) {
  const userAccuracy = userColor === 'white' ? whiteAccuracy : blackAccuracy
  const oppAccuracy = userColor === 'white' ? blackAccuracy : whiteAccuracy

  return (
    <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex-shrink-0">Accuracy</span>
      <span className="text-xs text-gray-500 ml-auto">You</span>
      <span className="text-xs font-mono text-blue-400">{userAccuracy.toFixed(0)}%</span>
      <span className="text-xs text-gray-600">·</span>
      <span className="text-xs text-gray-500">Opp</span>
      <span className="text-xs font-mono text-gray-500">{oppAccuracy.toFixed(0)}%</span>
    </div>
  )
}
