import { useCallback, useMemo, useState } from 'react'
import { useChessGame } from '../../../components/ChessBoard/hooks/useChessGame'
import { useGameAnalysis } from '../../../components/ChessBoard/hooks/useGameAnalysis'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { computeOpeningMatch } from '../utils/gameLogic'
import type { OpeningMatch } from '../utils/gameLogic'
import { findCriticalMoves } from '../utils/analysisUtils'
import type { Game, MoveClassification } from '../types'

export function useGameBoard(onAnalysisComplete: () => void) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const gameHistory = useChessGame({ interactiveAtEnd: false, orientation })

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

  const criticalMoveIndices = useMemo(() => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || !selectedGame) return []
    return findCriticalMoves(src.moves, src.initial_score ?? 0, selectedGame.user_color)
  }, [analysis, selectedGame?.analysis, selectedGame?.user_color, selectedGame])

  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game)
    setOrientation(game.user_color)
    gameHistory.loadFromPgn(game.pgn)
  }, [gameHistory.loadFromPgn])

  const flipOrientation = useCallback(() => {
    setOrientation(o => o === 'white' ? 'black' : 'white')
  }, [])

  return {
    selectedGame,
    selectGame,
    config: gameHistory.config,
    allMoves: gameHistory.allMoves,
    selectedMoveIndex: gameHistory.currentMoveIndex,
    threats: gameHistory.threats,
    flipOrientation,
    onMoveClick: gameHistory.handleMoveClick,
    analyze,
    analyzeStatus,
    analyzeProgress,
    analysis,
    moveClassifications,
    openingMatch,
    openingMoveCount,
    criticalMoveIndices,
  }
}
