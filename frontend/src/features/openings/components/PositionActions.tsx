import { AddToDrill } from '../../train/components/AddToDrill'
import type { CardCreate, RepertoireCard } from '../../train/types'

type Props = {
  drillCard: CardCreate | null
  existingCard: RepertoireCard | null
  annotationsDirty: boolean
  onSaveAnnotations: () => void
}

export function PositionActions({ drillCard, existingCard, annotationsDirty, onSaveAnnotations }: Props) {
  return (
    <div className="flex items-center gap-2">
      {annotationsDirty && (
        <button
          type="button"
          onClick={onSaveAnnotations}
          className="bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-50 border border-white/15 text-white/80 text-xs font-medium rounded px-3 py-1.5 transition-colors cursor-pointer"
        >
          Save annotations
        </button>
      )}
      {drillCard && (
        <AddToDrill
          card={drillCard}
          existingCard={existingCard}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded px-3 py-1.5 transition-colors cursor-pointer"
        />
      )}
    </div>
  )
}
