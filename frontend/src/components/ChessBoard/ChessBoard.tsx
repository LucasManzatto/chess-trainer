import { useChessGame } from './useChessGame'
import { useBoardSizing } from './useBoardSizing'
import { ChessGround } from './ChessGround'
import { useBoardSettingsStore } from './useBoardSettingsStore'
import type { MoveResult, GameOverResult } from './useChessGame'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'

export type { MoveResult, GameOverResult }

export type ChessBoardProps = {
  position?: string
  orientation?: 'white' | 'black'
  boardWidth?: number
  interactive?: boolean
  animationDurationInMs?: number
  lastMove?: [Key, Key]
  extraShapes?: DrawShape[]
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}

export function ChessBoard({
  position,
  orientation = 'white',
  boardWidth,
  interactive = true,
  animationDurationInMs = 300,
  lastMove,
  extraShapes,
  onMove,
  onGameOver,
}: ChessBoardProps) {
  const { config } = useChessGame({ position, interactive, orientation, animationDurationInMs, lastMove, onMove, onGameOver })
  const { size: storedSize } = useBoardSettingsStore()
  const resolvedWidth = boardWidth ?? storedSize
  const { containerRef, width } = useBoardSizing(resolvedWidth)

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <ChessGround config={config} width={width} autoShapes={extraShapes} />
    </div>
  )
}
