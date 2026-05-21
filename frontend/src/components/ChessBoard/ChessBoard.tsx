import { Chessboard } from 'react-chessboard'
import { useChessGame } from './useChessGame'
import { useBoardSizing } from './useBoardSizing'
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
  const { game, squareStyles, handlePieceDrop, handleSquareClick, handleMouseOverSquare, handleMouseOutSquare } =
    useChessGame({ position, interactive, onMove, onGameOver })
  const { containerRef } = useBoardSizing(boardWidth)

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Chessboard
        options={{
          position: game.fen(),
          boardOrientation: orientation,
          boardStyle: boardWidth ? { width: boardWidth } : undefined,
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick,
          onMouseOverSquare: handleMouseOverSquare,
          onMouseOutSquare: handleMouseOutSquare,
          squareStyles,
          showAnimations: true,
          animationDurationInMs,
        }}
      />
    </div>
  )
}
