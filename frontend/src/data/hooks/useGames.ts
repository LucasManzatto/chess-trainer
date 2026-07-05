import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gamesApi, profileApi, syncApi } from '../api'
import { gamesKeys } from '../queryKeys'
import type { AnalyzeStatus, GamesListResponse, SyncStatus, UserProfile } from '../../features/games/types'

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

export function useGameAnalyze(gameId: number | null) {
  const qc = useQueryClient()
  const [analyzeStatus, setAnalyzeStatus] = useState<AnalyzeStatus>('idle')
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const [analyzingGameId, setAnalyzingGameId] = useState<number | null>(null)

  const startPolling = useCallback((id: number) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await gamesApi.analyzeStatus(id)
        setAnalyzeStatus(status.status)
        setAnalyzeProgress({ current: status.current ?? 0, total: status.total ?? 0 })
        if (status.status !== 'running') {
          stopPolling()
          if (status.status === 'done') qc.invalidateQueries({ queryKey: gamesKeys.all() })
        }
      } catch {
        stopPolling()
      }
    }, 1000)
  }, [stopPolling, qc])

  useEffect(() => () => stopPolling(), [stopPolling])

  const analyze = useCallback(async () => {
    if (!gameId) return
    setAnalyzingGameId(gameId)
    setAnalyzeStatus('running')
    setAnalyzeProgress({ current: 0, total: 0 })
    await gamesApi.analyze(gameId)
    startPolling(gameId)
  }, [gameId, startPolling])

  // Status/progress belong to whichever game we last triggered analysis for —
  // if the selected game changed since, treat as idle rather than showing stale state.
  const isStale = analyzingGameId !== gameId
  return {
    analyzeStatus: isStale ? 'idle' : analyzeStatus,
    analyzeProgress: isStale ? { current: 0, total: 0 } : analyzeProgress,
    analyze,
  }
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
