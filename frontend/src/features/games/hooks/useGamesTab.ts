import { useCallback, useMemo, useState } from 'react'
import type { Key } from '@lichess-org/chessground/types'
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
  const gameHistory = useGameHistory()

  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game)
    setOrientation(game.user_color)
    gameHistory.loadFromPgn(game.pgn)
  }, [gameHistory.loadFromPgn])

  const flipOrientation = useCallback(() => {
    setOrientation(o => o === 'white' ? 'black' : 'white')
  }, [])

  const moves = gameHistory.moves
  const selectedMoveIndex = gameHistory.selectedIndex

  const moveSans = useMemo(() => moves.map(m => m.san), [moves])
  const lastMove = useMemo<[Key, Key] | undefined>(() => {
    const move = moves[selectedMoveIndex]
    return move ? [move.from as Key, move.to as Key] : undefined
  }, [moves, selectedMoveIndex])

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
    moves,
    moveSans,
    selectedMoveIndex,
    lastMove,
    currentFen: gameHistory.position,
    boardOrientation: orientation,
    flipOrientation,
    onMoveClick: gameHistory.handleMoveClick,
  }
}
