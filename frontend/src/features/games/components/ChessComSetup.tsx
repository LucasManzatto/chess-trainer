import { useState } from 'react'
import { useUpdateProfile } from '../hooks/useProfile'

type Props = {
  onComplete: () => void
}

export function ChessComSetup({ onComplete }: Props) {
  const [username, setUsername] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { update } = useUpdateProfile()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return
    setIsPending(true)
    setError(null)
    try {
      await update(trimmed)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save username')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect chess.com</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Enter your chess.com username to sync your game history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Your chess.com username"
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="px-4 py-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save & continue'}
        </button>
      </form>
    </div>
  )
}
