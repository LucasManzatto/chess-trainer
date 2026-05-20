import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import type { Square, Move } from 'chess.js'
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard'

export type MoveResult = {
  from: string
  to: string
  san: string
  promotion?: string
  fen: string
}

export type GameOverResult = {
  result: 'checkmate' | 'stalemate' | 'draw'
  winner?: 'w' | 'b'
}

const HINT_COLOR = 'rgba(0, 180, 80, 0.45)'

function executeMove(
  fen: string,
  from: string,
  to: string,
): { game: Chess; move: Move } | null {
  const gameCopy = new Chess(fen)
  const piece = gameCopy.get(from as Square)
  const isPromotion =
    piece?.type === 'p' &&
    ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))

  const move = gameCopy.move({ from, to, promotion: isPromotion ? 'q' : undefined })
  if (!move) return null
  return { game: gameCopy, move }
}

function notifyAfterMove(
  game: Chess,
  move: Move,
  onMove: ((m: MoveResult) => void) | undefined,
  onGameOver: ((r: GameOverResult) => void) | undefined,
) {
  onMove?.({ from: move.from, to: move.to, san: move.san, promotion: move.promotion, fen: game.fen() })
  if (!game.isGameOver()) return
  if (game.isCheckmate()) {
    onGameOver?.({ result: 'checkmate', winner: game.turn() === 'w' ? 'b' : 'w' })
  } else if (game.isStalemate()) {
    onGameOver?.({ result: 'stalemate' })
  } else {
    onGameOver?.({ result: 'draw' })
  }
}

type UseChessGameProps = {
  position?: string
  interactive?: boolean
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}

export type UseChessGameReturn = {
  game: Chess
  squareStyles: Record<string, CSSProperties>
  handlePieceDrop: (args: PieceDropHandlerArgs) => boolean
  handleSquareClick: (args: SquareHandlerArgs) => void
  handleMouseOverSquare: (args: SquareHandlerArgs) => void
  handleMouseOutSquare: (args: SquareHandlerArgs) => void
}

export function useChessGame({
  position,
  interactive = true,
  onMove,
  onGameOver,
}: UseChessGameProps): UseChessGameReturn {
  const [game, setGame] = useState(() => {
    const g = new Chess()
    if (position) g.load(position)
    return g
  })
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)

  // Track previous controlled position to detect prop changes during render
  const [prevPosition, setPrevPosition] = useState<string | undefined>(position)

  // Adjust state during render when controlled position prop changes (React pattern:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  if (position !== undefined && position !== prevPosition) {
    setPrevPosition(position)
    if (position !== game.fen()) {
      const g = new Chess()
      g.load(position)
      setGame(g)
    }
  }

  // Latest ref pattern — sync after every render so callbacks are always up-to-date
  const gameRef = useRef(game)
  const onMoveRef = useRef(onMove)
  const onGameOverRef = useRef(onGameOver)
  const interactiveRef = useRef(interactive)
  const selectedSquareRef = useRef(selectedSquare)

  useLayoutEffect(() => {
    gameRef.current = game
    onMoveRef.current = onMove
    onGameOverRef.current = onGameOver
    interactiveRef.current = interactive
    selectedSquareRef.current = selectedSquare
  })

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!interactiveRef.current) return false
    if (!targetSquare) return false

    const result = executeMove(gameRef.current.fen(), sourceSquare, targetSquare)
    if (!result) return false

    setGame(result.game)
    setSelectedSquare(null)
    notifyAfterMove(result.game, result.move, onMoveRef.current, onGameOverRef.current)
    return true
  }, [])

  const handleSquareClick = useCallback(({ square }: SquareHandlerArgs) => {
    if (!interactiveRef.current) return
    const sq = square as Square
    const currentGame = gameRef.current
    const currentSelected = selectedSquareRef.current

    if (currentSelected === sq) {
      setSelectedSquare(null)
      return
    }

    if (currentSelected) {
      const legalMoves = currentGame.moves({ square: currentSelected, verbose: true })
      if (legalMoves.some(m => m.to === sq)) {
        const result = executeMove(currentGame.fen(), currentSelected, sq)
        if (result) {
          setGame(result.game)
          setSelectedSquare(null)
          notifyAfterMove(result.game, result.move, onMoveRef.current, onGameOverRef.current)
        }
        return
      }
    }

    const piece = currentGame.get(sq)
    if (piece && piece.color === currentGame.turn()) {
      setSelectedSquare(sq)
    } else {
      setSelectedSquare(null)
    }
  }, [])

  const handleMouseOverSquare = useCallback(({ square }: SquareHandlerArgs) => {
    setHoveredSquare(square)
  }, [])

  const handleMouseOutSquare = useCallback((_: SquareHandlerArgs) => {
    setHoveredSquare(null)
  }, [])

  // Derive hint squares in render (cheap — O(legal moves))
  const legalMoves = selectedSquare ? game.moves({ square: selectedSquare, verbose: true }) : []
  const hintSquares = new Set(legalMoves.filter(m => m.captured === undefined).map(m => m.to))
  const captureSquares = new Set(legalMoves.filter(m => m.captured !== undefined).map(m => m.to))

  const squareStyles: Record<string, CSSProperties> = {}
  for (const sq of hintSquares) {
    squareStyles[sq] =
      hoveredSquare === sq
        ? { backgroundColor: HINT_COLOR }
        : { background: `radial-gradient(circle, ${HINT_COLOR} 28%, transparent 28%)` }
  }
  for (const sq of captureSquares) {
    squareStyles[sq] =
      hoveredSquare === sq
        ? { backgroundColor: HINT_COLOR }
        : { backgroundColor: 'rgba(0, 180, 80, 0.25)' }
  }

  return { game, squareStyles, handlePieceDrop, handleSquareClick, handleMouseOverSquare, handleMouseOutSquare }
}
