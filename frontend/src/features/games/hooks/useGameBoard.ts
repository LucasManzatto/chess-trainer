import { useCallback, useMemo, useState } from 'react'
import { useChessGame } from '../../../components/ChessBoard/hooks/useChessGame'
import { useGameAnalysis } from '../../../components/ChessBoard/hooks/useGameAnalysis'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { computeOpeningMoveCount } from '../utils/gameLogic'
import type { Game, MoveClassification } from '../types'

export function useGameBoard(onAnalysisComplete: () => void) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const gameHistory = useChessGame({ interactiveAtEnd: false, orientation })

  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(gameHistory.allFens, selectedGame?.id ?? null, 18, onAnalysisComplete)

  const { data: openings } = useOpenings()

  const openingMoveCount = useMemo(
    () => computeOpeningMoveCount(selectedGame?.moves ?? [], selectedGame?.eco ?? null, openings ?? []),
    [selectedGame?.moves, selectedGame?.eco, openings],
  )

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
    moveClassifications,
    openingMoveCount,
  }
}
