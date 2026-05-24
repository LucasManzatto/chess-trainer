import { useState, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { Square, Move } from 'chess.js'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { Config } from '@lichess-org/chessground/config'

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

function toDests(chess: Chess): Dests {
  const dests: Dests = new Map()
  for (const move of chess.moves({ verbose: true })) {
    const from = move.from as Key
    const to = move.to as Key
    const list = dests.get(from) ?? []
    list.push(to)
    dests.set(from, list)
  }
  return dests
}

function executeMove(fen: string, from: string, to: string): { game: Chess; move: Move } | null {
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
  orientation?: 'white' | 'black'
  animationDurationInMs?: number
  lastMove?: [Key, Key]
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}

export function useChessGame({
  position,
  interactive = true,
  orientation = 'white',
  animationDurationInMs = 300,
  lastMove: externalLastMove,
  onMove,
  onGameOver,
}: UseChessGameProps): { config: Config } {
  const [game, setGame] = useState(() => {
    const g = new Chess()
    if (position) g.load(position)
    return g
  })
  const [lastMove, setLastMove] = useState<[Key, Key] | undefined>(undefined)
  const [prevPosition, setPrevPosition] = useState<string | undefined>(position)

  // Adjust state during render when controlled position prop changes
  if (position !== prevPosition) {
    setPrevPosition(position)
    if (position === undefined) {
      setGame(new Chess())
    } else if (position !== game.fen()) {
      const g = new Chess()
      g.load(position)
      setGame(g)
    }
    setLastMove(undefined)
  }

  // Latest-ref pattern — keep callbacks and game always current for event handlers
  const gameRef = useRef(game)
  const onMoveRef = useRef(onMove)
  const onGameOverRef = useRef(onGameOver)

  useLayoutEffect(() => {
    gameRef.current = game
    onMoveRef.current = onMove
    onGameOverRef.current = onGameOver
  })

  // Stable callback — reads current state via refs so deps stay empty
  const handleAfterMove = useCallback((orig: Key, dest: Key) => {
    const result = executeMove(gameRef.current.fen(), orig, dest)
    if (!result) return
    setGame(result.game)
    setLastMove([orig, dest])
    notifyAfterMove(result.game, result.move, onMoveRef.current, onGameOverRef.current)
  }, [])

  const dests = useMemo(() => toDests(game), [game])
  const turn: 'white' | 'black' = game.turn() === 'w' ? 'white' : 'black'

  const config = useMemo((): Config => ({
    fen: game.fen(),
    orientation,
    turnColor: turn,
    check: game.inCheck(),
    lastMove: externalLastMove ?? lastMove,
    viewOnly: !interactive,
    movable: {
      free: false,
      color: interactive ? turn : undefined,
      dests: interactive ? dests : undefined,
      showDests: true,
      events: {
        after: handleAfterMove,
      },
    },
    animation: {
      enabled: true,
      duration: animationDurationInMs,
    },
    highlight: {
      lastMove: true,
      check: true,
    },
    premovable: { enabled: false },
  }), [game, orientation, interactive, turn, dests, handleAfterMove, lastMove, animationDurationInMs])

  return { config }
}
