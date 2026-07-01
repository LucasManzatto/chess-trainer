import { useState } from 'react'
import { useUpdateProfile } from '../../../data/hooks/useGames'

export function useChessComSetup(onComplete: () => void) {
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

  return { username, setUsername, isPending, error, handleSubmit }
}
