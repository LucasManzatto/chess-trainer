import { toast } from 'sonner'
import type { useCommitMove, useDeleteCard } from '../../../data/hooks/useTrain'
import type { CardCreate } from '../types'

type Props = {
  card: CardCreate
  className?: string
  commitMove: ReturnType<typeof useCommitMove>['mutate']
  isAdding: boolean
  deleteCard: ReturnType<typeof useDeleteCard>['mutate']
  isRemoving: boolean
}

export function AddToDrill({ card, className, commitMove, isAdding, deleteCard, isRemoving }: Props) {
  const isPending = isAdding || isRemoving

  if (card.position_id) {
    return (
      <button
        type="button"
        title="Remove from Drill"
        aria-label="Remove from Drill"
        className={
          className ??
          'w-7 h-7 flex items-center justify-center bg-red-700/60 hover:bg-red-600/70 disabled:opacity-50 text-red-200 text-base font-bold rounded transition-colors cursor-pointer'
        }
        disabled={isPending}
        onClick={() =>
          deleteCard(card.position_id!, {
            onSuccess: () => toast.success('Removed from drill'),
            onError: () => toast.error('Failed to remove from drill'),
          })
        }
      >
        −
      </button>
    )
  }

  return (
    <button
      type="button"
      title="Add to Drill"
      aria-label="Add to Drill"
      className={
        className ??
        'w-7 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-base font-bold rounded transition-colors cursor-pointer'
      }
      disabled={isPending}
      onClick={() =>
        commitMove(card, {
          onSuccess: () => toast.success('Added to drill'),
          onError: () => toast.error('Failed to add to drill'),
        })
      }
    >
      +
    </button>
  )
}
