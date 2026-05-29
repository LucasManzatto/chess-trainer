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
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 px-4 text-center">
            <span className="text-2xl opacity-20 select-none">⋯</span>
            <p className="text-sm text-white/25">No moves yet</p>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {moves.map(({ moveNumber, white, black }) => (
              <div key={moveNumber} className="grid grid-cols-[28px_1fr_1fr] text-sm">
                <span className="flex items-center px-2 py-1 text-xs text-white/25 select-none tabular-nums">
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
    <div className="px-4 h-11 flex items-center border-b border-white/[0.08] flex-shrink-0">
      <span
        className="text-white/80 font-semibold tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px' }}
      >
        Moves
      </span>
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
      className={`text-left px-2 py-1 rounded transition-colors font-mono text-sm ${
        active
          ? 'bg-amber-500/20 text-amber-200'
          : 'text-white/60 hover:bg-white/[0.07] hover:text-white/90'
      }`}
    >
      {san}
    </button>
  )
}
