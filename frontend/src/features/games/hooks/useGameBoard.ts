import { useCallback, useEffect, useMemo, useState } from 'react'
import { useChessGame } from '../../../components/ChessBoard/hooks/useChessGame'
import { useGameAnalysis } from '../../../components/ChessBoard/hooks/useGameAnalysis'
import { useChessStore } from '../../../components/ChessBoard/stores/chessStore'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { computeOpeningMatch } from '../utils/gameLogic'
import { findCriticalMoves } from '../utils/analysisUtils'
import type { Game, MoveClassification } from '../types'

export function useGameBoard(onAnalysisComplete: () => void, onOrientationChange?: (o: 'white' | 'black') => void) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const setMoveClassifications = useChessStore(s => s.setMoveClassifications)
  const setOpeningMoveCount = useChessStore(s => s.setOpeningMoveCount)
  const setCriticalMoveIndices = useChessStore(s => s.setCriticalMoveIndices)

  const gameHistory = useChessGame()

  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(gameHistory.allFens, gameHistory.allMoves, selectedGame?.id ?? null, 18, onAnalysisComplete)

  const { data: openings } = useOpenings()

  const openingMatch = useMemo(
    () => computeOpeningMatch(selectedGame?.moves ?? [], selectedGame?.eco ?? null, openings ?? []),
    [selectedGame?.moves, selectedGame?.eco, openings],
  )
  const openingMoveCount = openingMatch?.moveCount ?? 0

  const moveClassifications = useMemo((): MoveClassification[] | undefined => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || src.moves.length !== gameHistory.allMoves.length) return undefined
    return src.moves.map(m => m.classification)
  }, [analysis, selectedGame?.analysis, gameHistory.allMoves.length])

  useEffect(() => {
    setMoveClassifications(moveClassifications)
  }, [moveClassifications, setMoveClassifications])

  useEffect(() => {
    setOpeningMoveCount(openingMoveCount)
  }, [openingMoveCount, setOpeningMoveCount])

  const criticalMoveIndices = useMemo(() => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || !selectedGame) return []
    return findCriticalMoves(src.moves, src.initial_score ?? 0, selectedGame.user_color)
  }, [analysis, selectedGame?.analysis, selectedGame?.user_color, selectedGame])

  useEffect(() => {
    setCriticalMoveIndices(criticalMoveIndices)
  }, [criticalMoveIndices, setCriticalMoveIndices])

  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game)
    onOrientationChange?.(game.user_color)
    gameHistory.loadFromPgn(game.pgn)
  }, [gameHistory.loadFromPgn, onOrientationChange])

  return {
    selectedGame,
    selectGame,
    allMoves: gameHistory.allMoves,
    selectedMoveIndex: gameHistory.currentMoveIndex,
    onMoveClick: gameHistory.handleMoveClick,
    analyze,
    analyzeStatus,
    analyzeProgress,
    analysis,
    openingMatch,
    criticalMoveIndices,
  }
}
