import { useCallback, useMemo } from 'react'
import { useChessStore, useChessStoreApi } from '../stores/chessStore'
import { useArrowKeyNavigation } from '../../../hooks/useArrowKeyNavigation'
import { computeThreats } from '../utils'
import type { UseChessGameProps, ThreatSquares } from '../types'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { Config } from '@lichess-org/chessground/config'

const EMPTY_THREATS: ThreatSquares = { hanging: [], pinned: [] }

export type { MoveResult, GameOverResult, UseChessGameProps } from '../types'

export function useChessGame({
  interactive = true,
  interactiveAtEnd = false,
  orientation = 'white',
  animationDurationInMs = 300,
  onMove,
  onGameOver,
}: UseChessGameProps = {}) {
  const store = useChessStoreApi()
  const history = useChessStore(s => s.history)
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex)
  const chessEngine = useChessStore(s => s.chessEngine)
  const loadMoves = useChessStore(s => s.loadMoves)
  const navigateToIndex = useChessStore(s => s.navigateToIndex)
  const navigateBack = useChessStore(s => s.navigateBack)
  const navigateForward = useChessStore(s => s.navigateForward)
  const reset = useChessStore(s => s.reset)
  const undo = useChessStore(s => s.undo)

  useArrowKeyNavigation(navigateBack, navigateForward)

  const isAtEnd = currentMoveIndex === history.length - 1
  const isInteractive = interactive && (!interactiveAtEnd || isAtEnd)
  const turn: 'white' | 'black' = chessEngine.turn() === 'w' ? 'white' : 'black'

  const dests = useMemo(() => {
    const map: Dests = new Map()
    for (const move of chessEngine.moves({ verbose: true })) {
      const list = map.get(move.from as Key) ?? []
      list.push(move.to as Key)
      map.set(move.from as Key, list)
    }
    return map
  }, [chessEngine])

  const lastEntry = currentMoveIndex >= 0 ? history[currentMoveIndex] : undefined

  const executeStepMove = useCallback((orig: string, dest: string) => {
    const result = store.getState().applyMove(orig, dest)
    if (!result) return

    onMove?.(result)

    const { chessEngine: nextEngine } = store.getState()
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
    fen: chessEngine.fen(),
    orientation,
    turnColor: turn,
    check: chessEngine.inCheck(),
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
  }), [chessEngine, orientation, turn, isInteractive, dests, lastEntry, animationDurationInMs, executeStepMove])

  const allMoves = useMemo(() => history.map(e => e.san), [history])
  const currentMoves = useMemo(() => allMoves.slice(0, currentMoveIndex + 1), [allMoves, currentMoveIndex])
  const threats = lastEntry ? computeThreats(lastEntry.fen) : EMPTY_THREATS

  return {
    config,
    currentMoveIndex,
    allMoves,
    currentMoves,
    boardFen: lastEntry?.fen,
    lastMoveSquares: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] as [Key, Key] : undefined,
    loadMoves,
    navigateToIndex,
    navigateBack,
    navigateForward,
    reset,
    undo,
    threats,
  }
}
