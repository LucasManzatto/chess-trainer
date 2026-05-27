import { useMemo } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import type { Config } from '@lichess-org/chessground/config'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { useBoardSizing } from './hooks/useBoardSizing'
import { useChessDerivedState } from './hooks/useChessDerivedState'
import { ChessGround } from './ChessGround'
import { useBoardSettingsStore } from './stores/boardSettingsStore'
import { useChessStoreApi, useChessStore } from './stores/chessStore'
import { squareToPixel } from './utils'
import { HangingPieceIcon, PinnedPieceIcon } from '../icons'
import type { MoveResult, GameOverResult, ThreatSquares } from './types'

export type { MoveResult, GameOverResult }

const DOT_SIZE = 22

type BoardConfigOptions = {
  orientation: 'white' | 'black'
  interactive: boolean
  interactiveAtEnd: boolean
  animationDurationInMs: number
  onMove?: (result: MoveResult) => void
}

function useBoardConfig({ orientation, interactive, interactiveAtEnd, animationDurationInMs, onMove }: BoardConfigOptions) {
  const store = useChessStoreApi()
  const { chess, turn, dests, lastEntry } = useChessDerivedState()
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex)
  const historyLength = useChessStore(s => s.history.length)

  const isAtEnd = currentMoveIndex === historyLength - 1
  const isInteractive = interactive && (!interactiveAtEnd || isAtEnd)

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
        after: (orig, dest) => {
          const result = store.getState().applyMove(orig, dest)
          if (result) onMove?.(result)
        },
      },
    },
    animation: { enabled: true, duration: animationDurationInMs },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }), [chess, orientation, turn, isInteractive, dests, lastEntry, animationDurationInMs, store, onMove])

  return config
}

function ThreatOverlay({ threats, boardSize, orientation }: {
  threats: ThreatSquares
  boardSize: number
  orientation: 'white' | 'black'
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {threats.hanging.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation, DOT_SIZE)
        return (
          <div key={`h-${sq}`} className="absolute drop-shadow-md" style={{ width: DOT_SIZE, height: DOT_SIZE, left, top }}>
            <HangingPieceIcon />
          </div>
        )
      })}
      {threats.pinned.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation, DOT_SIZE)
        return (
          <div key={`p-${sq}`} className="absolute drop-shadow-md" style={{ width: DOT_SIZE, height: DOT_SIZE, left, top }}>
            <PinnedPieceIcon />
          </div>
        )
      })}
    </div>
  )
}

export type ChessBoardProps = {
  boardWidth?: number
  showThreats?: boolean
  orientation?: 'white' | 'black'
  interactive?: boolean
  interactiveAtEnd?: boolean
  animationDurationInMs?: number
  onMove?: (result: MoveResult) => void
  extraShapes?: DrawShape[]
  bestMove?: string
}

export function ChessBoard({
  boardWidth,
  showThreats,
  orientation = 'white',
  interactive = true,
  interactiveAtEnd = false,
  animationDurationInMs = 300,
  onMove,
  extraShapes,
  bestMove,
}: ChessBoardProps) {
  const { containerRef, width } = useBoardSizing(boardWidth)

  const config = useBoardConfig({ orientation, interactive, interactiveAtEnd, animationDurationInMs, onMove })
  const { threats } = useChessDerivedState()

  const autoShapes = useMemo<DrawShape[]>(() => [
    ...(extraShapes ?? []),
    ...(bestMove ? [{ orig: bestMove.slice(0, 2) as Key, dest: bestMove.slice(2, 4) as Key, brush: 'blue' }] : []),
  ], [extraShapes, bestMove])

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <ChessGround config={config} width={width} autoShapes={autoShapes} />
      {showThreats && threats && (
        <ThreatOverlay threats={threats} boardSize={width} orientation={orientation} />
      )}
    </div>
  )
}
