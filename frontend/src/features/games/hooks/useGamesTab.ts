import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGames } from './useGames'
import { useGamesSync } from './useGamesSync'
import { useProfile } from './useProfile'
import { useGameBoard } from './useGameBoard'
import { gamesKeys } from '../api/queryKeys'
import type { GamesFilters } from '../types'

const DEFAULT_FILTERS: GamesFilters = {
  result: null,
  color: null,
  time_class: null,
  eco: '',
}

export function useGamesTab() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [filters, setFilters] = useState<GamesFilters>(DEFAULT_FILTERS)

  const queryClient = useQueryClient()
  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()

  const onAnalysisComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gamesKeys.list(filters) })
  }, [queryClient, filters])

  const board = useGameBoard(onAnalysisComplete)

  function setResult(result: GamesFilters['result']) {
    setFilters(f => ({ ...f, result }))
  }
  function setColor(color: GamesFilters['color']) {
    setFilters(f => ({ ...f, color }))
  }
  function setTimeClass(time_class: GamesFilters['time_class']) {
    setFilters(f => ({ ...f, time_class }))
  }
  function setEco(eco: string) {
    setFilters(f => ({ ...f, eco }))
  }

  return {
    profile,
    profileLoading,
    username: profile?.chess_com_username ?? '',
    games: gamesData?.items ?? [],
    gamesTotal: gamesData?.total ?? 0,
    gamesLoading,
    filters,
    setResult,
    setColor,
    setTimeClass,
    setEco,
    syncStatus,
    isRunning,
    triggerSync,
    ...board,
  }
}
