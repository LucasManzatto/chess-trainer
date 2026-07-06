import type { MovePair, ActiveMove } from '../../lib/chess/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type { MovePair, ActiveMove }

type Props = {
  moves?: MovePair[]
  activeMove?: ActiveMove
  criticalMoveIndices?: number[]
  onMoveClick?: (moveNumber: number, color: 'white' | 'black') => void
}

export function MovesList({ moves = [], activeMove, criticalMoveIndices = [], onMoveClick }: Props) {
  const criticalSet = new Set(criticalMoveIndices)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MovesHeader />
      <ScrollArea className="flex-1 min-h-0">
        {moves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 px-4 text-center">
            <span className="text-2xl opacity-20 select-none">⋯</span>
            <p className="text-sm text-white/25">No moves yet</p>
          </div>
        ) : (
          <div className="flex flex-col py-1 pr-2.5">
            {moves.map(({ moveNumber, white, black }) => {
              return (
                <div key={moveNumber} className="grid grid-cols-[28px_1fr_1fr] text-sm">
                  <span className="flex items-center px-2 py-1 text-xs text-white/25 select-none tabular-nums">
                    {moveNumber}.
                  </span>
                  <MoveButton
                    san={white}
                    active={activeMove?.moveNumber === moveNumber && activeMove.color === 'white'}
                    critical={criticalSet.has((moveNumber - 1) * 2)}
                    onClick={() => onMoveClick?.(moveNumber, 'white')}
                  />
                  {black != null ? (
                    <MoveButton
                      san={black}
                      active={activeMove?.moveNumber === moveNumber && activeMove.color === 'black'}
                      critical={criticalSet.has((moveNumber - 1) * 2 + 1)}
                      onClick={() => onMoveClick?.(moveNumber, 'black')}
                    />
                  ) : (
                    <div />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function MovesHeader() {
  return (
    <div className="px-4 h-11 flex items-center border-b border-white/[0.08] flex-shrink-0">
      <span className="text-white/80 font-semibold tracking-tight text-sm">
        Moves
      </span>
    </div>
  )
}

type MoveButtonProps = {
  san: string
  active: boolean
  critical?: boolean
  onClick: () => void
}

function MoveButton({ san, active, critical, onClick }: MoveButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'justify-start font-mono h-auto py-1 border-0',
        active
          ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/20 hover:text-amber-200'
          : critical
            ? 'text-red-400 hover:text-red-300'
            : 'text-white/60 hover:text-white/90'
      )}
    >
      {san}
    </Button>
  )
}
