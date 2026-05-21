import { useChessGame } from './useChessGame'
import { useBoardSizing } from './useBoardSizing'
import { ChessGround } from './ChessGround'
import type { MoveResult, GameOverResult } from './useChessGame'

export type { MoveResult, GameOverResult }

export type ChessBoardProps = {
  position?: string
  orientation?: 'white' | 'black'
  boardWidth?: number
  interactive?: boolean
  animationDurationInMs?: number
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}

export function ChessBoard({
  position,
  orientation = 'white',
  boardWidth,
  interactive = true,
  animationDurationInMs = 300,
  onMove,
  onGameOver,
}: ChessBoardProps) {
  const { config } = useChessGame({ position, interactive, orientation, animationDurationInMs, onMove, onGameOver })
  const { containerRef, width } = useBoardSizing(boardWidth)

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <ChessGround config={config} width={width} />
    </div>
  )
}
