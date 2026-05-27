import { useMemo } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import type { Config } from '@lichess-org/chessground/config'
import { useBoardSizing } from './hooks/useBoardSizing'
import { useChessDerivedState } from './hooks/useChessDerivedState'
import { ChessGround } from './ChessGround'
import { useBoardSettingsStore } from './stores/boardSettingsStore'
import { useChessStore, useChessStoreApi } from './stores/chessStore'
import { squareToPixel } from './utils'
import { HangingPieceIcon, PinnedPieceIcon } from '../icons'
import type { MoveResult, GameOverResult, ThreatSquares } from './types'

export type { MoveResult, GameOverResult }

const DOT_SIZE = 22

function useBoardConfig() {
  const orientation = useChessStore(s => s.orientation)
  const store = useChessStoreApi()
  const { chess, turn, dests, lastEntry } = useChessDerivedState()

  const config = useMemo((): Config => ({
    fen: chess.fen(),
    orientation,
    turnColor: turn,
    check: chess.inCheck(),
    lastMove: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] : undefined,
    movable: {
      free: false,
      color: turn,
      dests,
      showDests: true,
      events: {
        after: (orig, dest) => store.getState().applyMove(orig, dest),
      },
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }), [chess, orientation, turn, dests, lastEntry, store])

  return { config, orientation }
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
}

export function ChessBoard({ boardWidth, showThreats }: ChessBoardProps) {
  const { size: storedSize } = useBoardSettingsStore()
  const resolvedWidth = boardWidth ?? storedSize
  const { containerRef, width } = useBoardSizing(resolvedWidth)

  const { config, orientation } = useBoardConfig()
  const { threats } = useChessDerivedState()
  const shapes = useChessStore(s => s.shapes)

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <ChessGround config={config} width={width} autoShapes={shapes} />
      {showThreats && threats && (
        <ThreatOverlay threats={threats} boardSize={width} orientation={orientation} />
      )}
    </div>
  )
}
