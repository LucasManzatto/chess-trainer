import { useMoveList } from './useMoveList'

type MoveListProps = {
  moves: string[]
  selectedIndex?: number | null
  onMoveClick?: (index: number) => void
}

type MovePairRowProps = {
  pairIndex: number
  white: string
  black: string | undefined
  selectedIndex: number | null
  onMoveClick?: (index: number) => void
  whiteRef: React.Ref<HTMLButtonElement>
  blackRef: React.Ref<HTMLButtonElement>
}

function MovePairRow({ pairIndex, white, black, selectedIndex, onMoveClick, whiteRef, blackRef }: MovePairRowProps) {
  const whiteIndex = pairIndex * 2
  const blackIndex = pairIndex * 2 + 1
  return (
    <tr key={`${pairIndex}-${white}`} className="hover:bg-white/5">
      <td className="text-gray-500 px-3 py-1 w-8 select-none">
        {pairIndex + 1}.
      </td>
      <td className="px-2 py-1 w-1/2">
        <MoveToken
          san={white}
          index={whiteIndex}
          selectedIndex={selectedIndex}
          onClick={onMoveClick}
          ref={whiteRef}
        />
      </td>
      <td className="px-2 py-1 w-1/2">
        {black !== undefined ? (
          <MoveToken
            san={black}
            index={blackIndex}
            selectedIndex={selectedIndex}
            onClick={onMoveClick}
            ref={blackRef}
          />
        ) : (
          ''
        )}
      </td>
    </tr>
  )
}

type MoveTokenProps = {
  san: string
  index: number
  selectedIndex: number | null
  onClick?: (index: number) => void
  ref?: React.Ref<HTMLButtonElement>
}

function MoveToken({ san, index, selectedIndex, onClick, ref }: MoveTokenProps) {
  return (
    <button
      ref={ref}
      onClick={() => onClick?.(index)}
      className={`font-mono w-full text-left px-1 rounded ${
        index === selectedIndex ? 'bg-amber-500/25 text-amber-200' : 'text-gray-100'
      }`}
    >
      {san}
    </button>
  )
}

export function MoveList({ moves, selectedIndex = null, onMoveClick }: MoveListProps) {
  const { bottomRef, tokenRefs, pairs } = useMoveList(moves, selectedIndex)

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
              {pairs.map(([white, black], pairIndex) => (
                <MovePairRow
                  key={`${pairIndex}-${white}`}
                  pairIndex={pairIndex}
                  white={white}
                  black={black}
                  selectedIndex={selectedIndex}
                  onMoveClick={onMoveClick}
                  whiteRef={el => { tokenRefs.current[pairIndex * 2] = el }}
                  blackRef={el => { tokenRefs.current[pairIndex * 2 + 1] = el }}
                />
              ))}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
