import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { useChessStore, useChessStoreApi } from '../stores/chessStore'
import { useArrowKeyNavigation } from '../../../hooks/useArrowKeyNavigation'
import { parsePgn } from '../../../chess/pgn'
import { useChessDerivedState } from './useChessDerivedState'
import type { UseChessGameProps } from '../types'
import type { GameMetadata } from '../../../chess/types'
import type { Key } from '@lichess-org/chessground/types'
import type { Config } from '@lichess-org/chessground/config'

export type { GameMetadata } from '../../../chess/types'
export type { MoveResult, GameOverResult, UseChessGameProps } from '../types'

const INITIAL_FEN = new Chess().fen()

export function useChessGame({
  interactive = true,
  interactiveAtEnd = false,
  orientation = 'white',
  animationDurationInMs = 300,
  onMove,
  onGameOver,
}: UseChessGameProps = {}) {
  const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null)

  const store = useChessStoreApi()
  const loadMoves = useChessStore(s => s.loadMoves)
  const navigateToIndex = useChessStore(s => s.navigateToIndex)
  const navigateBack = useChessStore(s => s.navigateBack)
  const navigateForward = useChessStore(s => s.navigateForward)
  const reset = useChessStore(s => s.reset)
  const undo = useChessStore(s => s.undo)

  const { chess, turn, dests, lastEntry, threats, history, currentMoveIndex } = useChessDerivedState()

  useArrowKeyNavigation(navigateBack, navigateForward)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') navigateToIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateToIndex])

  const isAtEnd = currentMoveIndex === history.length - 1
  const isInteractive = interactive && (!interactiveAtEnd || isAtEnd)

  const executeStepMove = useCallback((orig: string, dest: string) => {
    const result = store.getState().applyMove(orig, dest)
    if (!result) return

    onMove?.(result)

    const nextEngine = new Chess(result.fen)
    if (nextEngine.isGameOver()) {
      if (nextEngine.isCheckmate()) {
        onGameOver?.({ result: 'checkmate', winner: nextEngine.turn() === 'w' ? 'b' : 'w' })
      } else if (nextEngine.isStalemate()) {
        onGameOver?.({ result: 'stalemate' })
      } else {
        onGameOver?.({ result: 'draw' })
      }
    }
  }, [store, onMove, onGameOver])

  const config = useMemo((): Config => ({
    fen: chess.fen(),
    orientation,
    turnColor: turn,
    check: chess.inCheck(),
    lastMove: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] : undefined,
    viewOnly: !isInteractive,
    movable: {
      free: false,
      color: isInteractive ? turn : undefined,
      dests: isInteractive ? dests : undefined,
      showDests: true,
      events: {
        after: (orig, dest) => executeStepMove(orig, dest),
      },
    },
    animation: { enabled: true, duration: animationDurationInMs },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }), [chess, orientation, turn, isInteractive, dests, lastEntry, animationDurationInMs, executeStepMove])

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
    config,
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
