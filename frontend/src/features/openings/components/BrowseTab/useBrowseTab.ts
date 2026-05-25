import { useState, useMemo, useCallback } from 'react'
import { useOpenings } from '../../hooks/useOpenings'
import type { Opening } from '../../types'
import { openingColor } from '../../types'
import { computeCandidateShapes } from '../../../../components/ChessBoard/candidateShapes'
import { useChessGame } from '../../../../components/ChessBoard/useChessGame'
import { useBrowseOpeningContext } from './useBrowseOpeningContext'

export function useBrowseTab() {
  const { data: openings, isLoading } = useOpenings()
  const [search, setSearch] = useState('')
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const board = useChessGame({ orientation })
  const context = useBrowseOpeningContext(openings, board.currentMoves)

  const shapes = useMemo(
    () => computeCandidateShapes(context.candidateMoves, board.boardFen),
    [context.candidateMoves, board.boardFen],
  )

  const displayedOpenings = useMemo(() => {
    const base = board.currentMoveIndex >= 0 && context.matchingOpenings.length > 0
      ? context.matchingOpenings
      : (openings ?? [])
    return search
      ? base.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
      : base
  }, [openings, context.matchingOpenings, board.currentMoveIndex, search])

  function handleOpeningSelect(o: Opening) {
    board.loadMoves(o.moves)
    setOrientation(openingColor(o))
  }

  const flipOrientation = useCallback(() => {
    setOrientation(o => o === 'white' ? 'black' : 'white')
  }, [])

  const openingMoveIndex: number | null =
    context.selected && board.currentMoveIndex >= 0 && board.currentMoveIndex < context.selected.moves.length
      ? board.currentMoveIndex
      : null

  return {
    openings: displayedOpenings,
    isLoading,
    selected: context.selected,
    exactMatch: context.exactMatch,
    search,
    allMoves: board.allMoves,
    currentMoveIndex: board.currentMoveIndex,
    config: board.config,
    boardFen: board.boardFen,
    openingMoveIndex,
    candidateMoves: context.candidateMoves,
    shapes,
    setSearch,
    setMoveIndex: board.navigateToIndex,
    selectOpening: handleOpeningSelect,
    flipOrientation,
    resetBoard: board.reset,
  }
}
