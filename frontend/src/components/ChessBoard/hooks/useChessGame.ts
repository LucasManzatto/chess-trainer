import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { useChessStore } from '../stores/chessStore'
import { useArrowKeyNavigation } from '../../../hooks/useArrowKeyNavigation'
import { parsePgn } from '../../../chess/pgn'
import { useChessDerivedState } from './useChessDerivedState'
import type { GameMetadata } from '../../../chess/types'
import type { Key } from '@lichess-org/chessground/types'

export type { GameMetadata } from '../../../chess/types'

const INITIAL_FEN = new Chess().fen()

export function useChessGame() {
  const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null)

  const loadMoves = useChessStore(s => s.loadMoves)
  const navigateToIndex = useChessStore(s => s.navigateToIndex)
  const navigateBack = useChessStore(s => s.navigateBack)
  const navigateForward = useChessStore(s => s.navigateForward)
  const reset = useChessStore(s => s.reset)
  const undo = useChessStore(s => s.undo)

  const { lastEntry, threats, history, currentMoveIndex } = useChessDerivedState()

  useArrowKeyNavigation(navigateBack, navigateForward)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') navigateToIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateToIndex])

  const handleMoveClick = useCallback((index: number | null) => {
    navigateToIndex(index)
  }, [navigateToIndex])

  const loadFromPgn = useCallback((pgn: string): { ok: true } | { ok: false; error: string } => {
    const result = parsePgn(pgn)
    if (!result.ok) return result
    loadMoves(result.moves)
    setGameMetadata(result.metadata)
    return { ok: true }
  }, [loadMoves])

  const allMoves = useMemo(() => history.map(e => e.san), [history])
  const allFens = useMemo(() => [INITIAL_FEN, ...history.map(e => e.fen)], [history])
  const currentMoves = useMemo(() => allMoves.slice(0, currentMoveIndex + 1), [allMoves, currentMoveIndex])

  return {
    currentMoveIndex,
    allMoves,
    currentMoves,
    boardFen: lastEntry?.fen,
    lastMoveSquares: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] as [Key, Key] : undefined,
    allFens,
    gameMetadata,
    handleMoveClick,
    loadMoves,
    loadFromPgn,
    navigateToIndex,
    navigateBack,
    navigateForward,
    reset,
    undo,
    threats,
  }
}
