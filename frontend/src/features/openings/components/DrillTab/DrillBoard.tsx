import { ChessBoard } from '../../../../components/ChessBoard/ChessBoard'
import { DrillNotesPanel } from './DrillNotesPanel'
import type { DrillQueueItem } from '../../types'
import type { MoveResult } from '../../../../components/ChessBoard/ChessBoard'

type Props = {
  item: DrillQueueItem
  moveIndex: number
  interactive: boolean
  onMove: (move: MoveResult) => void
  flash: 'correct' | 'wrong' | null
  onBack: () => void
}

export function DrillBoard({ item, moveIndex, interactive, onMove, flash, onBack }: Props) {
  const progress = `${moveIndex} / ${item.moves.length}`

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-center">
          <div className="text-xs font-mono text-amber-400">{item.eco}</div>
          <div className="text-lg font-semibold text-white">{item.name}</div>
          <div className="text-xs text-gray-500 mt-1">{progress} moves</div>
        </div>

        <div
          className={`w-full max-w-lg transition-all duration-150 ${
            flash === 'wrong' ? 'ring-4 ring-red-500/60 rounded' : ''
          } ${flash === 'correct' ? 'ring-2 ring-green-500/40 rounded' : ''}`}
        >
          <ChessBoard interactive={interactive} onMove={onMove} />
        </div>

        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          ← Back to queue
        </button>
      </div>

      <DrillNotesPanel openingId={item.opening_id} moves={item.moves} />
    </div>
  )
}
