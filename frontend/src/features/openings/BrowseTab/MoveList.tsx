type Props = {
  moves: string[]
  moveIndex: number | null
  onMoveClick: (i: number | null) => void
}

function MoveButton({ san, index, selected, onClick }: {
  san: string
  index: number
  selected: number | null
  onClick: (i: number) => void
}) {
  return (
    <button
      onClick={() => onClick(index)}
      className={`font-mono text-left px-1 rounded w-full ${
        index === selected ? 'bg-amber-500/25 text-amber-200' : 'text-gray-100'
      }`}
    >
      {san}
    </button>
  )
}

export function MoveList({ moves, moveIndex, onMoveClick }: Props) {
  const pairCount = Math.ceil(moves.length / 2)
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Moves</h2>
        {moveIndex !== null && (
          <button onClick={() => onMoveClick(null)} className="text-xs text-gray-500 hover:text-gray-300">
            Reset
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: pairCount }, (_, pairIndex) => {
            const whiteIndex = pairIndex * 2
            const blackIndex = pairIndex * 2 + 1
            return (
              <tr key={pairIndex} className="hover:bg-white/5">
                <td className="text-gray-500 px-3 py-1 w-6 select-none text-xs">{pairIndex + 1}.</td>
                <td className="px-1 py-1">
                  <MoveButton
                    san={moves[whiteIndex]}
                    index={whiteIndex}
                    selected={moveIndex}
                    onClick={onMoveClick}
                  />
                </td>
                <td className="px-1 py-1">
                  {moves[blackIndex] !== undefined && (
                    <MoveButton
                      san={moves[blackIndex]}
                      index={blackIndex}
                      selected={moveIndex}
                      onClick={onMoveClick}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
