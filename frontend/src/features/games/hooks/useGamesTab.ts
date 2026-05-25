import { useState } from 'react'
import { useGameHistory } from '../../../hooks/useGameHistory'
import { useGames } from './useGames'
import { useGamesSync } from './useGamesSync'
import { useProfile } from './useProfile'
import type { Game, GamesFilters } from '../types'

const DEFAULT_FILTERS: GamesFilters = {
  result: null,
  color: null,
  time_class: null,
  eco: '',
}

export function useGamesTab() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [filters, setFilters] = useState<GamesFilters>(DEFAULT_FILTERS)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const gameHistory = useGameHistory()

  function selectGame(game: Game) {
    setSelectedGame(game)
    gameHistory.loadFromPgn(game.pgn)
  }

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

  const currentFen = gameHistory.position
  const boardOrientation = selectedGame?.user_color ?? 'white'

  return {
    profile,
    profileLoading,
    games: gamesData?.items ?? [],
    gamesTotal: gamesData?.total ?? 0,
    gamesLoading,
    selectedGame,
    selectGame,
    filters,
    setResult,
    setColor,
    setTimeClass,
    setEco,
    syncStatus,
    isRunning,
    triggerSync,
    // game replay
    moves: gameHistory.moves,
    selectedMoveIndex: gameHistory.selectedIndex,
    currentFen,
    boardOrientation,
    onMoveClick: gameHistory.handleMoveClick,
  }
}
