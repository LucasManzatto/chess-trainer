import { toast } from 'sonner'
import { useCommitMove } from '../hooks'
import type { CardCreate } from '../types'

type Props = {
  card: CardCreate
  className?: string
}

export function AddToDrill({ card, className }: Props) {
  const { mutate, isPending } = useCommitMove()

  function handleClick() {
    mutate(card, {
      onSuccess: () => toast.success('Added to drill'),
      onError: () => toast.error('Failed to add to drill'),
    })
  }

  return (
    <button
      className={className}
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? 'Adding…' : 'Add to Drill'}
    </button>
  )
}
