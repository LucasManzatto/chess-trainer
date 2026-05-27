import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useOpenings } from '../../hooks/useOpenings'
import type { Opening } from '../../types'
import { openingColor } from '../../types'
import { computeCandidateShapes } from '../../../../chess/analysis'
import { useChessGame } from '../../../../components/ChessBoard/hooks/useChessGame'
import { useBrowseOpeningContext } from './useBrowseOpeningContext'

export function useBrowsePage() {
  const { data: openings, isLoading } = useOpenings()
  const [search, setSearch] = useState('')
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const navigate = useNavigate()
  const { openingId } = useSearch({ from: '/openings/browse' })
  const autoSelectedRef = useRef<number | null>(null)

  const board = useChessGame()
  const context = useBrowseOpeningContext(openings, board.currentMoves)

  useEffect(() => {
    if (!openingId || !openings || autoSelectedRef.current === openingId) return
    const target = openings.find(o => o.id === openingId)
    if (!target) return
    autoSelectedRef.current = openingId
    board.loadMoves(target.moves)
    setOrientation(openingColor(target))
  }, [openingId, openings])

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
    navigate({ from: '/openings/browse', to: '/openings/browse', search: (prev) => ({ ...prev, openingId: o.id }), replace: true })
  }

  const openingMoveIndex: number | null =
    context.selected && board.currentMoveIndex >= 0 && board.currentMoveIndex < context.selected.moves.length
      ? board.currentMoveIndex
      : null

  return {
    orientation,
    openings: displayedOpenings,
    isLoading,
    selected: context.selected,
    exactMatch: context.exactMatch,
    search,
    allMoves: board.allMoves,
    currentMoveIndex: board.currentMoveIndex,
    boardFen: board.boardFen,
    openingMoveIndex,
    candidateMoves: context.candidateMoves,
    shapes,
    setSearch,
    setMoveIndex: board.navigateToIndex,
    selectOpening: handleOpeningSelect,
    resetBoard: board.reset,
  }
}
