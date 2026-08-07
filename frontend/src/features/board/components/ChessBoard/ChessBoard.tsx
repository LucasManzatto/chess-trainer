import { useEffect, useRef, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawBrushes, DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'
import { ANNOTATION_CATEGORIES, ANNOTATION_CATEGORY_BY_VALUE, type BoardAnnotationArrow, type BoardAnnotationCircle } from '../../types'

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_BRUSHES = {
  green:  { key: 'green',  color: '#15781B', opacity: 0.9, lineWidth: 10 },
  red:    { key: 'red',    color: '#882020', opacity: 0.9, lineWidth: 10 },
  blue:   { key: 'blue',   color: '#003088', opacity: 0.9, lineWidth: 10 },
  yellow: { key: 'yellow', color: '#e68f00', opacity: 0.9, lineWidth: 10 },
  hint:   { key: 'hint',   color: '#15781B', opacity: 0.9, lineWidth: 10 },
} as const

// One brush per category, keyed by category value, so a categorized arrow/circle is
// color-coded by category instead of the plain G/R/B/Y draw color.
const CATEGORY_BRUSHES = Object.fromEntries(
  ANNOTATION_CATEGORIES.map(c => [c.value, { key: c.value, color: c.fill, opacity: 0.9, lineWidth: 10 }]),
)

const SOLID_BRUSHES: Record<string, { key: string; color: string; opacity: number; lineWidth: number }> = {
  ...BASE_BRUSHES,
  ...CATEGORY_BRUSHES,
}

const noop = () => {}

const COLOR_TO_BRUSH: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }
const BRUSH_TO_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_TO_BRUSH).map(([color, brush]) => [brush, color]),
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChessBoardProps = {
  overlay?: ReactNode
  state: {
    fen: string
    orientation: 'white' | 'black'
    interactive: boolean
    lastMove: string | undefined
  }
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  config: {
    showBestMove: boolean
    boardSize: number
  }
  actions: {
    applyMove: (orig: Square, dest: Square) => void
    navigateBack: () => void
    navigateForward: () => void
    onDrawableChange?: (arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]) => void
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

function baseBrushKey(color: string, category: BoardAnnotationArrow['category']): string {
  return category ?? COLOR_TO_BRUSH[color] ?? color
}

// Glyph drawn as plain outlined text directly at the arrowhead/circle-center point (no
// separate badge circle) so it reads as printed on the shape itself, not overlaid on top of it.
const categoryGlyphSvg = (glyph: string, fill: string) =>
  `<text x="50" y="58" font-size="30" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff" stroke="${fill}" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${glyph}</text>`

function shapeCustomSvg(
  category: BoardAnnotationArrow['category'],
  center: 'label' | 'orig',
): DrawShape['customSvg'] | undefined {
  const glyph = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null
  if (!glyph) return undefined
  return { center, html: categoryGlyphSvg(glyph.glyph, glyph.fill) }
}

function toDrawShapes(arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]): DrawShape[] {
  return [
    ...arrows.map(a => ({
      orig: a.from_square as Key,
      dest: a.to_square as Key,
      brush: baseBrushKey(a.color, a.category),
      customSvg: shapeCustomSvg(a.category, 'label'),
    })),
    ...circles.map(c => ({
      orig: c.square as Key,
      brush: baseBrushKey(c.color, c.category),
      customSvg: shapeCustomSvg(c.category, 'orig'),
    })),
  ]
}

function fromDrawShapes(
  shapes: DrawShape[],
  prevArrows: BoardAnnotationArrow[],
  prevCircles: BoardAnnotationCircle[],
): { arrows: BoardAnnotationArrow[]; circles: BoardAnnotationCircle[] } {
  return {
    arrows: shapes.filter(isArrowShape).map(s => {
      const from_square = s.orig as string
      const to_square = s.dest as string
      const prev = prevArrows.find(a => a.from_square === from_square && a.to_square === to_square)
      // A brush is either a base G/R/B/Y draw color, or a per-category brush we render existing
      // shapes with — only the former is a real color change made by the user just now.
      return {
        from_square,
        to_square,
        color: prev?.category ? prev.color : brushToColor(s.brush),
        category: prev?.category ?? null,
        comment: prev?.comment ?? null,
      }
    }),
    circles: shapes.filter(s => !isArrowShape(s)).map(s => {
      const square = s.orig as string
      const prev = prevCircles.find(c => c.square === square)
      return {
        square,
        color: prev?.category ? prev.color : brushToColor(s.brush),
        category: prev?.category ?? null,
        comment: prev?.comment ?? null,
      }
    }),
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useBoardConfig(
  state: ChessBoardProps['state'],
  arrows: ChessBoardProps['arrows'],
  circles: ChessBoardProps['circles'],
  actions: ChessBoardProps['actions'],
): Config {
  const { fen, orientation, interactive, lastMove } = state
  const { applyMove, onDrawableChange: onAnnotationsChange = noop } = actions

  const chess = new Chess(fen)
  const turn = chess.turn() === 'w' ? 'white' as const : 'black' as const
  const check = chess.inCheck()

  const dests = interactive ? getDests(chess.moves({ verbose: true })) : new Map()

  const shapes = toDrawShapes(arrows, circles)
  const brushes = SOLID_BRUSHES as unknown as DrawBrushes

  function onDrawableChange(next: DrawShape[]) {
    const { arrows: nextArrows, circles: nextCircles } = fromDrawShapes(next, arrows, circles)
    onAnnotationsChange(nextArrows, nextCircles)
  }

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
      events: { after: (orig: Key, dest: Key) => applyMove(orig as Square, dest as Square) },
    },
    drawable: {
      shapes,
      brushes,
      onChange: onDrawableChange,
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
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

  // Chessground caches its bounding rect and only invalidates it on its own
  // ResizeObserver (size change), window resize, or scroll — none of which
  // fire when a sibling panel's width transitions and shifts the board
  // sideways without resizing it. Recompute bounds once that transition ends.
  useEffect(() => {
    function onTransitionEnd(e: TransitionEvent) {
      if (e.propertyName === 'width') apiRef.current?.redrawAll()
    }
    window.addEventListener('transitionend', onTransitionEnd)
    return () => window.removeEventListener('transitionend', onTransitionEnd)
  }, [])

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
  const config = useBoardConfig(props.state, props.arrows, props.circles, props.actions)
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
