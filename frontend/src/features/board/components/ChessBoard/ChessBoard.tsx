import { useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'
import type { PositionAnnotationArrow, PositionAnnotationCircle } from '../../../openings/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ANNOTATION_COLOR_MAP: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }
const BRUSH_TO_COLOR: Record<string, string> = { green: 'G', red: 'R', blue: 'B', yellow: 'Y' }

function annotationBrush(color: string): string {
  return ANNOTATION_COLOR_MAP[color] ?? color
}

const BRUSHES = {
  green:  { key: 'green',  color: '#15781B', opacity: 0.9, lineWidth: 10 },
  red:    { key: 'red',    color: '#882020', opacity: 0.9, lineWidth: 10 },
  blue:   { key: 'blue',   color: '#003088', opacity: 0.9, lineWidth: 10 },
  yellow: { key: 'yellow', color: '#e68f00', opacity: 0.9, lineWidth: 10 },
  hint:   { key: 'hint',   color: '#15781B', opacity: 0.9, lineWidth: 10 },
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfigParams = {
  fen: string
  orientation: 'white' | 'black'
  turn: 'white' | 'black'
  check: boolean
  interactive: boolean
  dests: Dests
  lastMove: string | undefined
  autoShapes: DrawShape[] | undefined
  onMove: (orig: Square, dest: Square) => void
  onShapesChange: (shapes: DrawShape[]) => void
}

export type ChessBoardProps = {
  overlay?: ReactNode
  state: {
    fen: string
    orientation: 'white' | 'black'
    interactive: boolean
    lastMove: string | undefined
  }
  shapes: {
    arrows?: PositionAnnotationArrow[]
    circles?: PositionAnnotationCircle[]
  }
  config: {
    showBestMove: boolean
    boardSize: number
  }
  actions: {
    applyMove: (orig: Square, dest: Square) => void
    navigateBack: () => void
    navigateForward: () => void
    createArrow?: (from_square: string, to_square: string, color: string) => void
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function shouldIgnoreKeyEvent(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
}

function getConfig({ fen, orientation, turn, check, interactive, dests, lastMove, autoShapes, onMove, onShapesChange }: ConfigParams): Config {
  return {
    fen,
    orientation,
    turnColor: turn,
    check,
    lastMove: lastMove ? [lastMove.slice(0, 2) as Key, lastMove.slice(2, 4) as Key] : undefined,
    viewOnly: !interactive,
    movable: {
      free: false,
      color: interactive ? turn : undefined,
      dests: interactive ? dests : undefined,
      showDests: true,
      events: { after: (orig: Key, dest: Key) => onMove(orig as Square, dest as Square) },
    },
    drawable: {
      autoShapes,
      brushes: BRUSHES,
      onChange: onShapesChange,
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useBoardConfig(
  state: ChessBoardProps['state'],
  shapes: ChessBoardProps['shapes'],
  actions: ChessBoardProps['actions'],
): Config {
  const { fen, orientation, interactive, lastMove } = state
  const { arrows = [], circles = [] } = shapes

  const annotationShapes = useMemo(
    () => [
      ...arrows.map(a => ({ orig: a.from_square as Key, dest: a.to_square as Key, brush: annotationBrush(a.color) })),
      ...circles.map(c => ({ orig: c.square as Key, brush: annotationBrush(c.color) })),
    ],
    [arrows, circles],
  )

  const { applyMove, createArrow } = actions

  const handleShapesChange = useCallback((newShapes: DrawShape[]) => {
    const last = newShapes[newShapes.length - 1]
    if (createArrow && last?.dest && last.orig !== last.dest) {
      createArrow(last.orig, last.dest, BRUSH_TO_COLOR[last.brush ?? 'green'] ?? 'G')
    }
  }, [createArrow])

  const chess = useMemo(() => new Chess(fen), [fen])
  const moves = useMemo(() => chess.moves({ verbose: true }), [chess])
  const dests = useMemo(() => interactive ? getDests(moves) : new Map(), [moves, interactive])

  return useMemo(
    () => getConfig({ fen, orientation, turn: chess.turn() === 'w' ? 'white' : 'black', check: chess.inCheck(), interactive, dests, lastMove, autoShapes: annotationShapes, onMove: applyMove, onShapesChange: handleShapesChange }),
    [fen, orientation, chess, interactive, dests, lastMove, annotationShapes, applyMove, handleShapesChange],
  )
}

function useChessground(config: Config) {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)

  useEffect(() => {
    if (!elRef.current) return
    apiRef.current = Chessground(elRef.current, config)
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.set(config)
  }, [config])

  return elRef
}

function useBoardKeyNav(navigateBack: () => void, navigateForward: () => void) {
  useEffect(() => {
    const keyActions: Partial<Record<string, () => void>> = {
      ArrowLeft: navigateBack,
      ArrowRight: navigateForward,
    }
    function onKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreKeyEvent(e.target)) return
      keyActions[e.key]?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateBack, navigateForward])
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChessBoard(props: ChessBoardProps) {
  const config = useBoardConfig(props.state, props.shapes, props.actions)
  const elRef = useChessground(config)
  useBoardKeyNav(props.actions.navigateBack, props.actions.navigateForward)

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: props.config.boardSize, height: props.config.boardSize }} />
      {props.overlay}
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
