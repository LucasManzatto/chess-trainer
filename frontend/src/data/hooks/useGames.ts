import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gamesApi, profileApi, syncApi } from '../api'
import { gamesKeys } from '../queryKeys'
import type { GameAnalysis, GamesListResponse, SyncStatus, UserProfile } from '../../features/games/types'

export function useGames(
  result: 'win' | 'loss' | 'draw' | null,
  color: 'white' | 'black' | null,
  time_class: 'bullet' | 'blitz' | 'rapid' | 'daily' | null,
) {
  const filters = { result, color, time_class }
  const qc = useQueryClient()
  const query = useQuery<GamesListResponse>({
    queryKey: gamesKeys.list(filters),
    queryFn: ({ signal }) => gamesApi.list(filters, 50, 0, signal),
  })

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: gamesKeys.list(filters) }),
    [qc, result, color, time_class],
  )

  return { ...query, invalidate }
}

export function useSaveGameAnalysis() {
  return useMutation({
    mutationFn: ({ gameId, analysis }: { gameId: number; analysis: GameAnalysis }) =>
      gamesApi.saveAnalysis(gameId, analysis),
  })
}

export function useGamesSync() {
  const qc = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isTriggerPending, setIsTriggerPending] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await syncApi.status()
        setSyncStatus(status)
        if (status.status !== 'running') {
          stopPolling()
          // Invalidate games list so new games appear
          qc.invalidateQueries({ queryKey: ['games-list'] })
          qc.invalidateQueries({ queryKey: gamesKeys.profile() })
        }
      } catch {
        stopPolling()
      }
    }, 2000)
  }, [stopPolling, qc])

  useEffect(() => () => stopPolling(), [stopPolling])

  const triggerSync = useCallback(async () => {
    setIsTriggerPending(true)
    try {
      await syncApi.trigger()
      setSyncStatus({ status: 'running', current_month: 0, total_months: null, games_added: 0, last_sync_at: null })
      startPolling()
    } finally {
      setIsTriggerPending(false)
    }
  }, [startPolling])

  const isRunning = syncStatus?.status === 'running' || isTriggerPending

  return { syncStatus, isRunning, triggerSync }
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: gamesKeys.profile(),
    queryFn: ({ signal }) => profileApi.get(signal),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  async function update(username: string) {
    const updated = await profileApi.update(username)
    qc.setQueryData(gamesKeys.profile(), updated)
    return updated
  }
  return { update }
}
