import type { MovePair, ActiveMove } from '../../lib/chess/types'

export type { MovePair, ActiveMove }

type Props = {
  moves?: MovePair[]
  activeMove?: ActiveMove
  onMoveClick?: (moveNumber: number, color: 'white' | 'black') => void
}

export function MovesList({ moves = [], activeMove, onMoveClick }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MovesHeader />
      <div className="flex-1 overflow-y-auto min-h-0">
        {moves.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-600">No moves yet.</p>
        ) : (
        <div className="flex flex-col">
          {moves.map(({ moveNumber, white, black }) => (
            <div key={moveNumber} className="grid grid-cols-[28px_1fr_1fr] text-sm">
              <span className="flex items-center px-2 py-1 text-xs text-gray-600 select-none">
                {moveNumber}.
              </span>
              <MoveButton
                san={white}
                active={activeMove?.moveNumber === moveNumber && activeMove.color === 'white'}
                onClick={() => onMoveClick?.(moveNumber, 'white')}
              />
              {black != null ? (
                <MoveButton
                  san={black}
                  active={activeMove?.moveNumber === moveNumber && activeMove.color === 'black'}
                  onClick={() => onMoveClick?.(moveNumber, 'black')}
                />
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}

function MovesHeader() {
  return (
    <div className="px-3 h-10 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moves</span>
    </div>
  )
}

type MoveButtonProps = {
  san: string
  active: boolean
  onClick: () => void
}

function MoveButton({ san, active, onClick }: MoveButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-2 py-1 rounded transition-colors font-mono ${
        active
          ? 'bg-amber-500/20 text-amber-200'
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {san}
    </button>
  )
}
