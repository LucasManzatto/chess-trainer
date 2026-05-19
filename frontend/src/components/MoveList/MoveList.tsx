import { useRef, useEffect } from 'react'
import type { MoveResult } from '../ChessBoard'

type MoveListProps = {
  moves: MoveResult[]
}

export function MoveList({ moves }: MoveListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  // Group flat move array into pairs: [[white, black?], ...]
  const pairs: [MoveResult, MoveResult | undefined][] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]])
  }

  const lastMoveIndex = moves.length - 1

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
                    <td
                      className={`px-2 py-1 w-1/2 font-mono ${
                        whiteIndex === lastMoveIndex
                          ? 'bg-amber-500/25 text-amber-200 rounded'
                          : 'text-gray-100'
                      }`}
                    >
                      {white.san}
                    </td>
                    <td
                      className={`px-2 py-1 w-1/2 font-mono ${
                        black && blackIndex === lastMoveIndex
                          ? 'bg-amber-500/25 text-amber-200 rounded'
                          : 'text-gray-100'
                      }`}
                    >
                      {black?.san ?? ''}
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
