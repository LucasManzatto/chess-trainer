import { useRef, useEffect } from 'react'

type MoveListProps = {
  moves: string[]
  selectedIndex?: number | null
  onMoveClick?: (index: number) => void
}

export function MoveList({ moves, selectedIndex = null, onMoveClick }: MoveListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  const pairs = Array.from(
    { length: Math.ceil(moves.length / 2) },
    (_, i) => [moves[i * 2], moves[i * 2 + 1]] as [string, string | undefined],
  )

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 px-3 py-2 border-b border-white/10">
        Moves
      </h2>

      <div className="flex-1 overflow-y-auto min-h-0">
        {moves.length === 0 ? (
          <p className="text-gray-500 text-sm px-3 py-4">No moves yet</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {pairs.map(([white, black], pairIndex) => {
                const whiteIndex = pairIndex * 2
                const blackIndex = pairIndex * 2 + 1
                return (
                  <tr key={pairIndex} className="hover:bg-white/5">
                    <td className="text-gray-500 px-3 py-1 w-8 select-none">
                      {pairIndex + 1}.
                    </td>
                    <td className="px-2 py-1 w-1/2">
                      <button
                        onClick={() => onMoveClick?.(whiteIndex)}
                        className={`font-mono w-full text-left px-1 rounded ${
                          whiteIndex === selectedIndex
                            ? 'bg-amber-500/25 text-amber-200'
                            : 'text-gray-100'
                        }`}
                      >
                        {white}
                      </button>
                    </td>
                    <td className="px-2 py-1 w-1/2">
                      {black !== undefined ? (
                        <button
                          onClick={() => onMoveClick?.(blackIndex)}
                          className={`font-mono w-full text-left px-1 rounded ${
                            blackIndex === selectedIndex
                              ? 'bg-amber-500/25 text-amber-200'
                              : 'text-gray-100'
                          }`}
                        >
                          {black}
                        </button>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
