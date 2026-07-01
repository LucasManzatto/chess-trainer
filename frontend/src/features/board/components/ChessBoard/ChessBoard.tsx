import { useEffect, useRef, useMemo, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { DrawBrush, DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'
import type { Annotation, AnnotationColor } from '../../../../lib/chess/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ANNOTATION_COLOR_MAP: Record<AnnotationColor, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }

const BRUSHES = {
  green:  { key: 'green',  color: '#15781B', opacity: 0.9, lineWidth: 10 },
  red:    { key: 'red',    color: '#882020', opacity: 0.9, lineWidth: 10 },
  blue:   { key: 'blue',   color: '#003088', opacity: 0.9, lineWidth: 10 },
  yellow: { key: 'yellow', color: '#e68f00', opacity: 0.9, lineWidth: 10 },
  hint:   { key: 'hint',   color: '#15781B', opacity: 0.9, lineWidth: 10 },
  eval:   { key: 'eval',   color: '#003088', opacity: 0.9, lineWidth: 10 },
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
  drawnShapes: DrawShape[]
  extraBrushes: Record<string, DrawBrush>
  onMove: (orig: Square, dest: Square) => void
  onShapesChange: (shapes: DrawShape[]) => void
}

export type ChessBoardProps = {
  overlay?: ReactNode
  state: {
    fen: string
    orientation: 'white' | 'black'
    interactive: boolean
    evalBestMove: string | undefined
    lastMove: string | undefined
  }
  shapes: {
    annotations: Annotation | undefined
    hint?: DrawShape[]
    continuations?: { lan: string; is_main_line: boolean }[]
    drawn: DrawShape[]
    brushes: Record<string, DrawBrush>
  }
  config: {
    showBestMove: boolean
    boardSize: number
  }
  actions: {
    applyMove: (orig: Square, dest: Square) => void
    navigateBack: () => void
    navigateForward: () => void
    setDrawnShapes: (shapes: DrawShape[] | undefined) => void
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function shouldIgnoreKeyEvent(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
}

function getBestMoveShape(evalBestMove: string | undefined, showBestMove: boolean): DrawShape[] {
  if (!showBestMove || !evalBestMove) return []
  return [{ orig: evalBestMove.slice(0, 2) as Key, dest: evalBestMove.slice(2, 4) as Key, brush: 'eval' }]
}

function getConfig({ fen, orientation, turn, check, interactive, dests, lastMove, autoShapes, drawnShapes, extraBrushes, onMove, onShapesChange }: ConfigParams): Config {
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
      shapes: drawnShapes,
      brushes: { ...BRUSHES, ...extraBrushes },
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
  config: ChessBoardProps['config'],
  actions: ChessBoardProps['actions'],
): Config {
  const { fen, orientation, interactive, evalBestMove, lastMove } = state
  const { annotations, hint = [], continuations = [], drawn: drawnShapes, brushes: hintBrushes } = shapes

  const continuationShapes = useMemo(
    () => continuations.map(m => ({
      orig: m.lan.slice(0, 2) as Key,
      dest: m.lan.slice(2, 4) as Key,
      brush: m.is_main_line ? 'green' : 'blue',
    })),
    [continuations],
  )

  const hintShapes = useMemo(() => [...hint, ...continuationShapes], [hint, continuationShapes])
  const { showBestMove } = config
  const { applyMove, setDrawnShapes } = actions

  const chess = useMemo(() => new Chess(fen), [fen])
  const moves = useMemo(() => chess.moves({ verbose: true }), [chess])
  const dests = useMemo(() => interactive ? getDests(moves) : new Map(), [moves, interactive])

  const bestMoveShape = useMemo(
    () => getBestMoveShape(evalBestMove, showBestMove),
    [evalBestMove, showBestMove],
  )

  const annotationShapes = useMemo((): DrawShape[] => {
    if (!annotations) return []
    return [
      ...annotations.arrows.map(a => ({ orig: a.from as Key, dest: a.to as Key, brush: ANNOTATION_COLOR_MAP[a.color] })),
      ...annotations.circles.map(c => ({ orig: c.square as Key, brush: ANNOTATION_COLOR_MAP[c.color] })),
    ]
  }, [annotations])

  const allShapes = useMemo(
    () => [...annotationShapes, ...hintShapes, ...bestMoveShape],
    [annotationShapes, hintShapes, bestMoveShape],
  )

  return useMemo(
    () => getConfig({ fen, orientation, turn: chess.turn() === 'w' ? 'white' : 'black', check: chess.inCheck(), interactive, dests, lastMove, autoShapes: allShapes, drawnShapes, extraBrushes: hintBrushes, onMove: applyMove, onShapesChange: setDrawnShapes }),
    [fen, orientation, chess, interactive, dests, lastMove, allShapes, drawnShapes, hintBrushes, applyMove, setDrawnShapes],
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
  const config = useBoardConfig(props.state, props.shapes, props.config, props.actions)
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
