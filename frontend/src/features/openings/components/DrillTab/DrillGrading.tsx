import { NotesPanel } from '../NotesPanel'
import { GRADE_BUTTONS } from './useDrillTab'
import type { DrillQueueItem, DrillGrade } from '../../types'

type Props = {
  item: DrillQueueItem
  onGrade: (grade: DrillGrade) => void
}

export function DrillGrading({ item, onGrade }: Props) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center">
          <div className="text-green-400 text-lg mb-1">✓ Complete</div>
          <div className="text-xs font-mono text-amber-400">{item.eco}</div>
          <div className="text-lg font-semibold text-white">{item.name}</div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">How well did you recall it?</p>
          <div className="flex gap-2">
            {GRADE_BUTTONS.map(({ grade, label, color }) => (
              <button
                key={grade}
                onClick={() => onGrade(grade)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-64 flex-shrink-0 border-l border-white/10 p-3 overflow-y-auto">
        <NotesPanel openingId={item.opening_id} moveIndex={null} fen={undefined} moves={item.moves} />
      </div>
    </div>
  )
}
