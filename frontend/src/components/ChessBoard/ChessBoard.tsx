import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard'

const HINT_COLOR = 'rgba(0, 180, 80, 0.45)'

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

  // Responsive sizing via ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(560)

  useEffect(() => {
    if (boardWidth !== undefined) return
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [boardWidth])

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (!interactiveRef.current) return false
      if (!targetSquare) return false

      const gameCopy = new Chess(gameRef.current.fen())

      // Detect pawn promotion: pawn reaching last rank
      const piece = gameCopy.get(sourceSquare as Parameters<typeof gameCopy.get>[0])
      const isPromotion =
        piece?.type === 'p' &&
        ((piece.color === 'w' && targetSquare[1] === '8') ||
          (piece.color === 'b' && targetSquare[1] === '1'))

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      })

      if (!move) return false

      setGame(gameCopy)
      setSelectedSquare(null)

      onMoveRef.current?.({
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: move.promotion,
        fen: gameCopy.fen(),
      })

      if (gameCopy.isGameOver()) {
        if (gameCopy.isCheckmate()) {
          const winner = gameCopy.turn() === 'w' ? 'b' : 'w'
          onGameOverRef.current?.({ result: 'checkmate', winner })
        } else if (gameCopy.isStalemate()) {
          onGameOverRef.current?.({ result: 'stalemate' })
        } else {
          onGameOverRef.current?.({ result: 'draw' })
        }
      }

      return true
    },
    [],
  )

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
      const moves = currentGame.moves({ square: currentSelected, verbose: true })
      const legalMove = moves.find(m => m.to === sq)

      if (legalMove) {
        const gameCopy = new Chess(currentGame.fen())
        const piece = gameCopy.get(currentSelected)
        const isPromotion =
          piece?.type === 'p' &&
          ((piece.color === 'w' && sq[1] === '8') || (piece.color === 'b' && sq[1] === '1'))

        const move = gameCopy.move({ from: currentSelected, to: sq, promotion: isPromotion ? 'q' : undefined })

        if (move) {
          setGame(gameCopy)
          setSelectedSquare(null)
          onMoveRef.current?.({ from: move.from, to: move.to, san: move.san, promotion: move.promotion, fen: gameCopy.fen() })

          if (gameCopy.isGameOver()) {
            if (gameCopy.isCheckmate()) {
              onGameOverRef.current?.({ result: 'checkmate', winner: gameCopy.turn() === 'w' ? 'b' : 'w' })
            } else if (gameCopy.isStalemate()) {
              onGameOverRef.current?.({ result: 'stalemate' })
            } else {
              onGameOverRef.current?.({ result: 'draw' })
            }
          }
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

  const squareStyles: Record<string, React.CSSProperties> = {}
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

  const width = boardWidth ?? containerWidth

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Chessboard
        options={{
          position: game.fen(),
          boardOrientation: orientation,
          boardStyle: { width },
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
