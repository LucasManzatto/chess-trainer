import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useGames } from './useGames'
import { useGamesSync } from './useGamesSync'
import { useProfile } from './useProfile'
import { useGameBoard } from './useGameBoard'
import { gamesKeys } from '../api/queryKeys'
import type { Game, GamesFilters } from '../types'

export function useGamesPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const navigate = useNavigate()
  const { result, color, time_class, eco, gameId } = useSearch({ from: '/_auth/games/list' })

  const filters: GamesFilters = useMemo(
    () => ({ result, color, time_class, eco }),
    [result, color, time_class, eco],
  )

  const queryClient = useQueryClient()
  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()

  const onAnalysisComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gamesKeys.list(filters) })
  }, [queryClient, filters])

  const board = useGameBoard(onAnalysisComplete)

  const autoSelectedRef = useRef<number | null>(null)
  const games = gamesData?.items ?? []

  useEffect(() => {
    if (!gameId || gamesLoading) return
    if (autoSelectedRef.current === gameId) return

    const game = games.find(g => g.id === gameId)
    if (game) {
      autoSelectedRef.current = gameId
      board.selectGame(game)
    } else {
      navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, gameId: undefined }), replace: true })
    }
  }, [gameId, games, gamesLoading, board.selectGame, navigate])

  const selectGame = useCallback((game: Game) => {
    board.selectGame(game)
    navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, gameId: game.id }), replace: true })
  }, [board.selectGame, navigate])

  function setResult(result: GamesFilters['result']) {
    navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, result }), replace: true })
  }
  function setColor(color: GamesFilters['color']) {
    navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, color }), replace: true })
  }
  function setTimeClass(time_class: GamesFilters['time_class']) {
    navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, time_class }), replace: true })
  }
  function setEco(eco: string) {
    navigate({ from: '/games/list', to: '/games/list', search: (prev) => ({ ...prev, eco }), replace: true })
  }

  return {
    profile,
    profileLoading,
    username: profile?.chess_com_username ?? '',
    games,
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
    selectGame,
  }
}
