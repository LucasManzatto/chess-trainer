import { useMemo, useState } from 'react'
import { useMoveList } from './useMoveList'
import type { MoveClassification } from '../ChessBoard/types'
import { PanelSection } from '../PanelSection'
import { useChessStore } from '../ChessBoard/stores/chessStore'

type MoveListProps = {
  onReset?: () => void
  showHeader?: boolean
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
  showCriticalOnly: boolean
}

function MovePairRow({ pairIndex, white, black, selectedIndex, onMoveClick, whiteRef, blackRef, whiteClassification, blackClassification, openingMoveCount, criticalMoveIndices, showCriticalOnly }: MovePairRowProps) {
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
          showCriticalOnly={showCriticalOnly}
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
            showCriticalOnly={showCriticalOnly}
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
  showCriticalOnly?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function MoveToken({ san, index, selectedIndex, onClick, classification, isOpening, isCritical, showCriticalOnly, ref }: MoveTokenProps) {
  const classificationColor = classification ? CLASSIFICATION_COLORS[classification] : undefined
  const symbol = classification ? CLASSIFICATION_SYMBOLS[classification] : ''
  const isSelected = index === selectedIndex
  const dimmed = showCriticalOnly && !isCritical && !isSelected
  const colorClass = isSelected
    ? 'bg-amber-500/25 text-amber-200'
    : dimmed
      ? 'text-gray-600'
      : classificationColor || (isOpening ? 'text-amber-500' : 'text-gray-100')

  return (
    <button
      ref={ref}
      onClick={() => onClick?.(index)}
      className={`font-mono w-full text-left px-1 rounded hover:bg-white/10 ${colorClass}`}
    >
      {isCritical && <span className="text-amber-400/60 mr-0.5 text-xs">↓</span>}
      {san}
      {symbol && !dimmed && <span className={`text-xs ml-0.5 ${classificationColor}`}>{symbol}</span>}
    </button>
  )
}

export function MoveList({ onReset, showHeader = true }: MoveListProps) {
  const history = useChessStore(s => s.history)
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessStore(s => s.navigateToIndex)
  const moveClassifications = useChessStore(s => s.moveClassifications)
  const openingMoveCount = useChessStore(s => s.openingMoveCount)
  const criticalMoveIndices = useChessStore(s => s.criticalMoveIndices)

  const moves = useMemo(() => history.map(e => e.san), [history])
  const selectedIndex = currentMoveIndex >= 0 && currentMoveIndex < moves.length ? currentMoveIndex : null
  const onMoveClick = navigateToIndex

  const { bottomRef, tokenRefs, pairs } = useMoveList(moves, selectedIndex)
  const hasClassifications = moveClassifications && moveClassifications.length === moves.length
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)

  const headerAction = (
    <div className="flex items-center gap-2">
      {criticalMoveIndices.length > 0 && (
        <button
          onClick={() => setShowCriticalOnly(v => !v)}
          className={`text-xs transition-colors ${showCriticalOnly ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {showCriticalOnly ? 'Critical only' : 'All moves'}
        </button>
      )}
      {moves.length > 0 && onReset && (
        <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Reset
        </button>
      )}
    </div>
  )

  const content = (
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
                showCriticalOnly={showCriticalOnly}
              />
            ))}
          </tbody>
        </table>
      )}
      <div ref={bottomRef} />
    </div>
  )

  if (showHeader) {
    return (
      <PanelSection title="Moves" headerAction={headerAction}>
        {content}
      </PanelSection>
    )
  }

  return <div className="flex flex-col h-full">{content}</div>
}
