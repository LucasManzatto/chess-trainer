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
      className={`font-mono text-left px-2 py-0.5 rounded w-full transition-colors ${
        index === selected
          ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
          : 'text-gray-200 hover:bg-white/8 hover:text-white'
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
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.06]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moves</h2>
        {moveIndex !== null && (
          <button onClick={() => onMoveClick(null)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
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
              <tr key={pairIndex}>
                <td className="text-gray-600 px-3 py-0.5 w-7 select-none text-xs text-right">{pairIndex + 1}.</td>
                <td className="px-1 py-0.5">
                  <MoveButton
                    san={moves[whiteIndex]}
                    index={whiteIndex}
                    selected={moveIndex}
                    onClick={onMoveClick}
                  />
                </td>
                <td className="px-1 py-0.5">
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
