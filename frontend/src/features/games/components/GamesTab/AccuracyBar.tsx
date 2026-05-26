type AccuracyBarProps = {
  whiteAccuracy: number
  blackAccuracy: number
  userColor: 'white' | 'black'
}

export function AccuracyBar({ whiteAccuracy, blackAccuracy, userColor }: AccuracyBarProps) {
  const rows = [
    { label: 'White', value: whiteAccuracy, isUser: userColor === 'white' },
    { label: 'Black', value: blackAccuracy, isUser: userColor === 'black' },
  ]

  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Accuracy</span>
      <div className="flex flex-col gap-2">
        {rows.map(({ label, value, isUser }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`text-xs w-10 flex-shrink-0 ${isUser ? 'text-gray-200' : 'text-gray-500'}`}>
              {label}
            </span>
            <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${isUser ? 'bg-blue-400' : 'bg-gray-500'}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={`text-xs font-mono w-8 text-right flex-shrink-0 ${isUser ? 'text-blue-400' : 'text-gray-500'}`}>
              {value.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
