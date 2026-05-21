import { useState, useEffect, useCallback } from 'react'
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

  // Remount the board when the window loses focus mid-drag — dnd-kit won't fire
  // onDragEnd in that case, leaving the ghost piece stuck at the source square.
  const [boardKey, setBoardKey] = useState(0)
  const resetBoard = useCallback(() => setBoardKey(k => k + 1), [])
  useEffect(() => {
    const onBlur = () => resetBoard()
    const onVisibility = () => { if (document.hidden) resetBoard() }
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [resetBoard])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Chessboard
        key={boardKey}
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
