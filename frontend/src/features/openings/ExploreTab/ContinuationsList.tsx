type Props = {
  candidateMoves: Map<string, number>
}

export function ContinuationsList({ candidateMoves }: Props) {
  if (candidateMoves.size === 0) return null

  return (
    <div className="border-b border-white/10">
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Continuations</div>
      <div className="max-h-40 overflow-y-auto">
        {[...candidateMoves.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([san, count]) => (
            <div key={san} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-white/5">
              <span className="font-mono text-gray-200">{san}</span>
              <span className="text-gray-500 text-xs">{count}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
