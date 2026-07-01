import { toast } from 'sonner'
import { useCommitMove, useDeleteCard } from '../../../data/hooks/useTrain'
import type { CardCreate, RepertoireCard } from '../types'

type Props = {
  card: CardCreate
  existingCard: RepertoireCard | null
  className?: string
}

export function AddToDrill({ card, existingCard, className }: Props) {
  const { mutate: commitMove, isPending: isAdding } = useCommitMove()
  const { mutate: deleteCard, isPending: isRemoving } = useDeleteCard()

  const isPending = isAdding || isRemoving

  if (existingCard) {
    return (
      <button
        type="button"
        className="bg-red-700/60 hover:bg-red-600/70 disabled:opacity-50 text-red-200 text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
        disabled={isPending}
        onClick={() =>
          deleteCard(existingCard.position_id, {
            onSuccess: () => toast.success('Removed from drill'),
            onError: () => toast.error('Failed to remove from drill'),
          })
        }
      >
        {isRemoving ? 'Removing…' : 'Remove from Drill'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() =>
        commitMove(card, {
          onSuccess: () => toast.success('Added to drill'),
          onError: () => toast.error('Failed to add to drill'),
        })
      }
    >
      {isAdding ? 'Adding…' : 'Add to Drill'}
    </button>
  )
}
