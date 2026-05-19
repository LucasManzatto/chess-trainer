import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'

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
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}

export function ChessBoard({
  position,
  orientation = 'white',
  boardWidth,
  onMove,
  onGameOver,
}: ChessBoardProps) {
  const [game, setGame] = useState(() => {
    const g = new Chess()
    if (position) g.load(position)
    return g
  })

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

  // Latest ref pattern — sync after every render so handlePieceDrop is always up-to-date
  const gameRef = useRef(game)
  const onMoveRef = useRef(onMove)
  const onGameOverRef = useRef(onGameOver)

  useLayoutEffect(() => {
    gameRef.current = game
    onMoveRef.current = onMove
    onGameOverRef.current = onGameOver
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

  const width = boardWidth ?? containerWidth

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Chessboard
        options={{
          position: game.fen(),
          boardOrientation: orientation,
          boardStyle: { width },
          onPieceDrop: handlePieceDrop,
        }}
      />
    </div>
  )
}
