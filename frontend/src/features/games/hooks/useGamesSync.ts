import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncApi } from '../api'
import { gamesKeys } from '../api/queryKeys'
import type { SyncStatus } from '../types'

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
