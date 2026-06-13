import { useResetCards } from '../hooks/useResetCards'

export function ResetCardsButton() {
  const { mutate, isPending } = useResetCards()

  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      className="text-xs text-red-400 border border-red-400/30 hover:bg-red-400/10 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
    >
      {isPending ? 'Resetting…' : 'Reset all cards'}
    </button>
  )
}
