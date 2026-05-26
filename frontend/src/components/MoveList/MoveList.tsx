import { useMoveList } from './useMoveList'
import type { MoveClassification } from '../ChessBoard/types'

type MoveListProps = {
  moves: string[]
  selectedIndex?: number | null
  onMoveClick?: (index: number) => void
  onReset?: () => void
  showHeader?: boolean
  moveClassifications?: MoveClassification[]
  openingMoveCount?: number
  criticalMoveIndices?: number[]
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  best: 'text-blue-400',
  excellent: 'text-emerald-400',
  good: '',
  inaccuracy: 'text-yellow-400',
  mistake: 'text-orange-400',
  blunder: 'text-red-400',
}

const CLASSIFICATION_SYMBOLS: Record<MoveClassification, string> = {
  best: '',
  excellent: '!',
  good: '',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
}

type MovePairRowProps = {
  pairIndex: number
  white: string
  black: string | undefined
  selectedIndex: number | null
  onMoveClick?: (index: number) => void
  whiteRef: React.Ref<HTMLButtonElement>
  blackRef: React.Ref<HTMLButtonElement>
  whiteClassification?: MoveClassification
  blackClassification?: MoveClassification
  openingMoveCount: number
  criticalMoveIndices: number[]
}

function MovePairRow({ pairIndex, white, black, selectedIndex, onMoveClick, whiteRef, blackRef, whiteClassification, blackClassification, openingMoveCount, criticalMoveIndices }: MovePairRowProps) {
  const whiteIndex = pairIndex * 2
  const blackIndex = pairIndex * 2 + 1
  return (
    <tr key={`${pairIndex}-${white}`}>
      <td className="text-gray-500 px-3 py-1 w-8 select-none">
        {pairIndex + 1}.
      </td>
      <td className="px-2 py-1 w-1/2">
        <MoveToken
          san={white}
          index={whiteIndex}
          selectedIndex={selectedIndex}
          onClick={onMoveClick}
          classification={whiteClassification}
          isOpening={whiteIndex < openingMoveCount}
          isCritical={criticalMoveIndices.includes(whiteIndex)}
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
            classification={blackClassification}
            isOpening={blackIndex < openingMoveCount}
            isCritical={criticalMoveIndices.includes(blackIndex)}
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
  classification?: MoveClassification
  isOpening?: boolean
  isCritical?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function MoveToken({ san, index, selectedIndex, onClick, classification, isOpening, isCritical, ref }: MoveTokenProps) {
  const classificationColor = classification ? CLASSIFICATION_COLORS[classification] : undefined
  const symbol = classification ? CLASSIFICATION_SYMBOLS[classification] : ''
  const colorClass = index === selectedIndex
    ? 'bg-amber-500/25 text-amber-200'
    : classificationColor || (isOpening ? 'text-amber-500' : 'text-gray-100')

  return (
    <button
      ref={ref}
      onClick={() => onClick?.(index)}
      className={`font-mono w-full text-left px-1 rounded hover:bg-white/10 ${colorClass}`}
    >
      {isCritical && <span className="text-amber-400/60 mr-0.5 text-xs">↓</span>}
      {san}
      {symbol && <span className={`text-xs ml-0.5 ${classificationColor}`}>{symbol}</span>}
    </button>
  )
}

export function MoveList({ moves, selectedIndex = null, onMoveClick, onReset, showHeader = true, moveClassifications, openingMoveCount = 0, criticalMoveIndices = [] }: MoveListProps) {
  const { bottomRef, tokenRefs, pairs } = useMoveList(moves, selectedIndex)
  const hasClassifications = moveClassifications && moveClassifications.length === moves.length

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moves</h2>
          {moves.length > 0 && onReset && (
            <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Reset
            </button>
          )}
        </div>
      )}

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
                  whiteClassification={hasClassifications ? moveClassifications[pairIndex * 2] : undefined}
                  blackClassification={hasClassifications ? moveClassifications[pairIndex * 2 + 1] : undefined}
                  openingMoveCount={openingMoveCount}
                  criticalMoveIndices={criticalMoveIndices}
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
