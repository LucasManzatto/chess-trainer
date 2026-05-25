import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGameHistory } from '../../../hooks/useGameHistory'
import { useGamesList } from '../components/GamesList/useGamesList'
import { useGames } from './useGames'
import { useGamesSync } from './useGamesSync'
import { useProfile } from './useProfile'
import { useGameAnalysis } from '../../../components/ChessBoard/hooks/useGameAnalysis'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { gamesKeys } from '../api/queryKeys'
import type { Game, MoveClassification } from '../types'

export function useGamesTab() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const queryClient = useQueryClient()
  const { filters, setResult, setColor, setTimeClass, setEco } = useGamesList()
  const { data: gamesData, isLoading: gamesLoading } = useGames(filters)
  const { syncStatus, isRunning, triggerSync } = useGamesSync()
  const gameHistory = useGameHistory({ orientation })

  const onAnalysisComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gamesKeys.list(filters) })
  }, [queryClient, filters])

  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(gameHistory.allFens, selectedGame?.id ?? null, 18, onAnalysisComplete)

  const { data: openings } = useOpenings()

  const openingMoveCount = useMemo(() => {
    if (!selectedGame?.eco || !openings) return 0
    let best = 0
    for (const opening of openings) {
      if (opening.eco !== selectedGame.eco) continue
      const n = opening.moves.length
      if (n <= best) continue
      if (opening.moves.every((m, i) => selectedGame.moves[i] === m)) best = n
    }
    return best
  }, [selectedGame, openings])

  const moveClassifications = useMemo((): MoveClassification[] | undefined => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || src.moves.length !== gameHistory.allMoves.length) return undefined
    return src.moves.map(m => m.classification)
  }, [analysis, selectedGame?.analysis, gameHistory.allMoves.length])

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
    threats: gameHistory.threats,
    flipOrientation,
    onMoveClick: gameHistory.handleMoveClick,
    analyze,
    analyzeStatus,
    analyzeProgress,
    moveClassifications,
    openingMoveCount,
  }
}
