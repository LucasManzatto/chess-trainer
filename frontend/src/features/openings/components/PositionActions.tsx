import { AddToDrill } from '../../train/components/AddToDrill'
import type { CardCreate, RepertoireCard } from '../../train/types'

type Props = {
  drillCard: CardCreate | null
  existingCard: RepertoireCard | null
}

export function PositionActions({ drillCard, existingCard }: Props) {
  return (
    <div className="flex items-center gap-2">
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
