import { useCallback, useState } from 'react'
import { useGameHistory } from '../../../hooks/useGameHistory'
import { useGamesList } from '../components/GamesList/useGamesList'
import { useGames } from './useGames'
import { useGamesSync } from './useGamesSync'
import { useProfile } from './useProfile'
import type { Game } from '../types'

export function useGamesTab() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const { filters, setResult, setColor, setTimeClass, setEco } = useGamesList()
  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const gameHistory = useGameHistory({ orientation })

  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game)
    setOrientation(game.user_color)
    gameHistory.loadFromPgn(game.pgn)
  }, [gameHistory.loadFromPgn])

  const flipOrientation = useCallback(() => {
    setOrientation(o => o === 'white' ? 'black' : 'white')
  }, [])

  return {
    profile,
    profileLoading,
    username: profile?.chess_com_username ?? '',
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
    config: gameHistory.config,
    allMoves: gameHistory.allMoves,
    selectedMoveIndex: gameHistory.currentMoveIndex,
    flipOrientation,
    onMoveClick: gameHistory.handleMoveClick,
  }
}
