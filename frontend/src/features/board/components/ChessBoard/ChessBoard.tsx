import { useEffect, useRef, useMemo, useState, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Dests, Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'

// ─── Constants ───────────────────────────────────────────────────────────────

const BRUSHES = {
  green:  { key: 'green',  color: '#15781B', opacity: 0.9, lineWidth: 10 },
  red:    { key: 'red',    color: '#882020', opacity: 0.9, lineWidth: 10 },
  blue:   { key: 'blue',   color: '#003088', opacity: 0.9, lineWidth: 10 },
  yellow: { key: 'yellow', color: '#e68f00', opacity: 0.9, lineWidth: 10 },
  hint:   { key: 'hint',   color: '#15781B', opacity: 0.9, lineWidth: 10 },
} as const

const COLOR_TO_BRUSH: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }
const BRUSH_TO_COLOR: Record<string, string> = { green: 'G', red: 'R', blue: 'B', yellow: 'Y' }

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnotationArrow = { from_square: string; to_square: string; color: string }
export type AnnotationCircle = { square: string; color: string }

type ConfigParams = {
  fen: string
  orientation: 'white' | 'black'
  turn: 'white' | 'black'
  check: boolean
  interactive: boolean
  dests: Dests
  lastMove: string | undefined
  shapes: DrawShape[]
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
  arrows: AnnotationArrow[]
  circles: AnnotationCircle[]
  config: {
    showBestMove: boolean
    boardSize: number
  }
  actions: {
    applyMove: (orig: Square, dest: Square) => void
    navigateBack: () => void
    navigateForward: () => void
    onAnnotationsChange?: (arrows: AnnotationArrow[], circles: AnnotationCircle[]) => void
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function shouldIgnoreKeyEvent(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
}

function brushToColor(brush: string | undefined): string {
  return BRUSH_TO_COLOR[brush ?? 'green'] ?? 'G'
}

function isArrowShape(shape: DrawShape): boolean {
  return !!shape.dest && shape.dest !== shape.orig
}

function toDrawShapes(arrows: AnnotationArrow[], circles: AnnotationCircle[]): DrawShape[] {
  return [
    ...arrows.map(a => ({ orig: a.from_square as Key, dest: a.to_square as Key, brush: COLOR_TO_BRUSH[a.color] ?? a.color })),
    ...circles.map(c => ({ orig: c.square as Key, brush: COLOR_TO_BRUSH[c.color] ?? c.color })),
  ]
}

function fromDrawShapes(shapes: DrawShape[]): { arrows: AnnotationArrow[]; circles: AnnotationCircle[] } {
  return {
    arrows: shapes.filter(isArrowShape).map(s => ({
      from_square: s.orig as string,
      to_square: s.dest as string,
      color: brushToColor(s.brush),
    })),
    circles: shapes.filter(s => !isArrowShape(s)).map(s => ({
      square: s.orig as string,
      color: brushToColor(s.brush),
    })),
  }
}

function getConfig({ fen, orientation, turn, check, interactive, dests, lastMove, shapes, onMove, onShapesChange }: ConfigParams): Config {
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
      shapes,
      brushes: BRUSHES,
      onChange: onShapesChange,
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

// Draft arrows/circles mirror the server-backed props but update immediately on
// draw so the board doesn't wait on the persist round-trip. The board's fen
// (Zustand store) and the arrows/circles (async query, keyed by fen) update on
// different clocks, so the draft resyncs off arrows/circles reference changes
// directly rather than off fen — this also catches the case where a fen switch
// lands before that fen's annotations have finished loading.
function useAnnotationDraft(
  arrows: AnnotationArrow[],
  circles: AnnotationCircle[]
) {
  const [draftArrows, setDraftArrows] = useState(arrows)
  const [draftCircles, setDraftCircles] = useState(circles)

  useEffect(() => {
    setDraftArrows(arrows)
  }, [arrows])

  useEffect(() => {
    setDraftCircles(circles)
  }, [circles])

  const onShapesChange = (next: DrawShape[]) => {
    const { arrows: nextArrows, circles: nextCircles } = fromDrawShapes(next)
    setDraftArrows(nextArrows)
    setDraftCircles(nextCircles)
  }

  const isArrowsDirty = draftArrows !== arrows

  return [draftArrows, draftCircles, onShapesChange, isArrowsDirty] as const
}

function useBoardConfig(
  fen: string,
  orientation: 'white' | 'black',
  interactive: boolean,
  lastMove: string | undefined,
  shapes: DrawShape[],
  applyMove: (orig: Square, dest: Square) => void,
  onShapesChange: (shapes: DrawShape[]) => void,
): Config {
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  const dests = interactive ? getDests(moves) : new Map()

  return useMemo(
    () => getConfig({ fen, orientation, turn: chess.turn() === 'w' ? 'white' : 'black', check: chess.inCheck(), interactive, dests, lastMove, shapes, onMove: applyMove, onShapesChange }),
    [fen, orientation, chess, interactive, dests, lastMove, shapes, applyMove, onShapesChange],
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
  const [draftArrows, draftCircles, onShapesChange, isArrowsDirty] = useAnnotationDraft(props.arrows, props.circles)
  const shapes = toDrawShapes(draftArrows, draftCircles)

  const config = useBoardConfig(
    props.state.fen,
    props.state.orientation,
    props.state.interactive,
    props.state.lastMove,
    shapes,
    props.actions.applyMove,
    onShapesChange,
  )
  const elRef = useChessground(config)
  useBoardKeyNav(props.actions.navigateBack, props.actions.navigateForward)

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: props.config.boardSize, height: props.config.boardSize }} />
      {isArrowsDirty && (
        <button
          type="button"
          onClick={() => props.actions.onAnnotationsChange?.(draftArrows, draftCircles)}
          className="absolute top-2 right-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white/80 text-xs font-medium rounded px-3 py-1.5 transition-colors cursor-pointer"
        >
          Save annotations
        </button>
      )}
      {props.overlay}
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
