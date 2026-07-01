import { useCallback, useMemo, useState } from 'react'
import { useGameAnalysis } from '../../../features/board/hooks/useGameAnalysis'
import { usePositions } from '../../../data/hooks/usePositions'
import { computeOpeningMatch } from '../utils/gameLogic'
import { findCriticalMoves } from '../utils/analysisUtils'
import type { Game, MoveClassification } from '../types'

export function useGameBoard(onAnalysisComplete: () => void, onOrientationChange?: (o: 'white' | 'black') => void) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const allFens: string[] = []
  const allMoves: string[] = selectedGame?.moves ?? []

  const { analyze, status: analyzeStatus, progress: analyzeProgress, analysis } =
    useGameAnalysis(allFens, allMoves, selectedGame?.id ?? null, 18, onAnalysisComplete)

  const { data: openings } = usePositions()

  const openingMatch = useMemo(
    () => computeOpeningMatch(selectedGame?.moves ?? [], openings ?? []),
    [selectedGame?.moves, selectedGame?.eco, openings],
  )

  const moveClassifications = useMemo((): MoveClassification[] | undefined => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || src.moves.length !== allMoves.length) return undefined
    return src.moves.map(m => m.classification)
  }, [analysis, selectedGame?.analysis, allMoves.length])

  const criticalMoveIndices = useMemo(() => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || !selectedGame) return []
    return findCriticalMoves(src.moves, src.initial_score ?? 0, selectedGame.user_color)
  }, [analysis, selectedGame?.analysis, selectedGame?.user_color, selectedGame])

  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game)
    onOrientationChange?.(game.user_color)
  }, [onOrientationChange])

  return {
    selectedGame,
    selectGame,
    allMoves,
    moveClassifications,
    analyze,
    analyzeStatus,
    analyzeProgress,
    analysis,
    openingMatch,
    criticalMoveIndices,
  }
}
