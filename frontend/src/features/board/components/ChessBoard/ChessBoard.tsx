import { useEffect, useRef, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawBrushes, DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'
import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CATEGORY_BY_VALUE,
  type AnnotationLineStyle,
  type BoardAnnotationArrow,
  type BoardAnnotationCircle,
} from '../../types'

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

// chessground's own brushes have no dash/fill support, so any shape that isn't a plain solid
// line/ring is drawn entirely by us via customSvg instead — this brush just keeps that shape's
// native rendering fully invisible.
const GHOST_BRUSH_KEY = 'annotation-custom'

const SOLID_BRUSHES: Record<string, { key: string; color: string; opacity: number; lineWidth: number }> = {
  ...BASE_BRUSHES,
  ...CATEGORY_BRUSHES,
  [GHOST_BRUSH_KEY]: { key: GHOST_BRUSH_KEY, color: 'transparent', opacity: 0, lineWidth: 1 },
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

// A solid-styled shape (the vast majority) is drawn natively by chessground — cheapest path,
// zero custom geometry. Anything dashed/dotted, or a filled square, has no chessground brush
// equivalent, so it's drawn entirely by us via customSvg instead, with the native shape hidden.
function arrowBrushKey(color: string, category: BoardAnnotationArrow['category'], lineStyle: AnnotationLineStyle): string {
  return lineStyle === 'solid' ? baseBrushKey(color, category) : GHOST_BRUSH_KEY
}
function circleBrushKey(
  color: string,
  category: BoardAnnotationCircle['category'],
  lineStyle: AnnotationLineStyle,
  fill: boolean,
): string {
  return lineStyle === 'solid' && !fill ? baseBrushKey(color, category) : GHOST_BRUSH_KEY
}

// Glyph drawn as plain outlined text directly on the shape (no separate badge circle) so it
// reads as printed on the shape itself, not overlaid on top of it.
const categoryGlyphSvg = (glyph: string, fill: string, x = 50, y = 58) =>
  `<text x="${x}" y="${y}" font-size="30" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff" stroke="${fill}" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${glyph}</text>`

// Small numbered badge — depicts an arrow's step in a multi-move plan (1, 2, 3, …).
const orderBadgeSvg = (order: number, fill: string, x: number, y: number) => `
  <circle cx="${x}" cy="${y}" r="13" fill="${fill}" stroke="#fff" stroke-width="2" />
  <text x="${x}" y="${y + 5}" font-size="15" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">${order}</text>
`

const DASH_PATTERN: Record<'dashed' | 'dotted', string> = { dashed: '16 12', dotted: '2 12' }

// customSvg's 1×1 embedded box (viewBox 0 0 100 100) covers exactly one board square, so
// 100 local units == 1 square, regardless of which point (orig/dest/label) it's anchored to.
const SQUARE_UNITS = 100

function squareFileRank(square: string): [number, number] {
  return [square.charCodeAt(0) - 97, Number(square[1]) - 1]
}

/** Angle + length (in squares) of an arrow, in the same screen-space direction chessground
 *  itself renders it in — i.e. accounting for board orientation. */
function arrowGeometry(from: string, to: string, orientation: 'white' | 'black'): { angle: number; lengthSquares: number } {
  const [ff, fr] = squareFileRank(from)
  const [tf, tr] = squareFileRank(to)
  const dFile = tf - ff
  const dRank = tr - fr
  let vx = dFile
  let vy = -dRank // svg y grows downward; a higher rank sits higher on screen
  if (orientation === 'black') { vx = -vx; vy = -vy }
  return { angle: Math.atan2(vy, vx), lengthSquares: Math.hypot(dFile, dRank) }
}

// Full hand-drawn shaft + arrowhead, since chessground brushes can't dash a line.
function dashedArrowShaftSvg(hex: string, angle: number, lengthLocal: number, lineStyle: 'dashed' | 'dotted'): string {
  const headLen = 22
  const shaftLen = Math.max(0, lengthLocal - headLen)
  const shaftX = 50 + Math.cos(angle) * shaftLen
  const shaftY = 50 + Math.sin(angle) * shaftLen
  const tipX = 50 + Math.cos(angle) * lengthLocal
  const tipY = 50 + Math.sin(angle) * lengthLocal
  const perp = angle + Math.PI / 2
  const wingX = Math.cos(perp) * 10
  const wingY = Math.sin(perp) * 10
  return `
    <line x1="50" y1="50" x2="${shaftX}" y2="${shaftY}" stroke="${hex}" stroke-width="10"
      stroke-linecap="round" stroke-dasharray="${DASH_PATTERN[lineStyle]}" opacity="0.9" />
    <polygon points="${tipX},${tipY} ${shaftX + wingX},${shaftY + wingY} ${shaftX - wingX},${shaftY - wingY}" fill="${hex}" opacity="0.9" />
  `
}

function arrowCustomSvg(
  hex: string,
  category: BoardAnnotationArrow['category'],
  order: number | null,
  lineStyle: AnnotationLineStyle,
  angle: number,
  lengthSquares: number,
): DrawShape['customSvg'] | undefined {
  const glyph = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null

  if (lineStyle === 'solid') {
    if (!glyph && order == null) return undefined
    let html = glyph ? categoryGlyphSvg(glyph.glyph, glyph.fill) : ''
    if (order != null) html += orderBadgeSvg(order, hex, 20, 20)
    return { center: 'label', html }
  }

  const lengthLocal = lengthSquares * SQUARE_UNITS
  let html = dashedArrowShaftSvg(hex, angle, lengthLocal, lineStyle)
  if (glyph) {
    html += categoryGlyphSvg(glyph.glyph, glyph.fill, 50 + Math.cos(angle) * lengthLocal * 0.68, 50 + Math.sin(angle) * lengthLocal * 0.68)
  }
  if (order != null) {
    html += orderBadgeSvg(order, hex, 50 + Math.cos(angle) * lengthLocal * 0.18, 50 + Math.sin(angle) * lengthLocal * 0.18)
  }
  return { center: 'orig', html }
}

function circleCustomSvg(
  hex: string,
  category: BoardAnnotationCircle['category'],
  lineStyle: AnnotationLineStyle,
  fill: boolean,
): DrawShape['customSvg'] | undefined {
  const glyph = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null
  const needsCustomDraw = fill || lineStyle !== 'solid'

  if (!needsCustomDraw) {
    if (!glyph) return undefined
    return { center: 'orig', html: categoryGlyphSvg(glyph.glyph, glyph.fill) }
  }

  const shapeSvg = fill
    ? `<rect x="4" y="4" width="92" height="92" rx="10" fill="${hex}" opacity="0.35" />`
    : `<circle cx="50" cy="50" r="42" fill="none" stroke="${hex}" stroke-width="8" ${lineStyle === 'dashed' || lineStyle === 'dotted' ? `stroke-dasharray="${DASH_PATTERN[lineStyle]}"` : ''} opacity="0.9" />`
  const html = shapeSvg + (glyph ? categoryGlyphSvg(glyph.glyph, glyph.fill) : '')
  return { center: 'orig', html }
}

function toDrawShapes(
  arrows: BoardAnnotationArrow[],
  circles: BoardAnnotationCircle[],
  orientation: 'white' | 'black',
): DrawShape[] {
  return [
    ...arrows.map(a => {
      const hex = SOLID_BRUSHES[baseBrushKey(a.color, a.category)]?.color ?? a.color
      const { angle, lengthSquares } = arrowGeometry(a.from_square, a.to_square, orientation)
      return {
        orig: a.from_square as Key,
        dest: a.to_square as Key,
        brush: arrowBrushKey(a.color, a.category, a.line_style),
        customSvg: arrowCustomSvg(hex, a.category, a.order, a.line_style, angle, lengthSquares),
      }
    }),
    ...circles.map(c => {
      const hex = SOLID_BRUSHES[baseBrushKey(c.color, c.category)]?.color ?? c.color
      return {
        orig: c.square as Key,
        brush: circleBrushKey(c.color, c.category, c.line_style, c.fill),
        customSvg: circleCustomSvg(hex, c.category, c.line_style, c.fill),
      }
    }),
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
      // A brush is either a base G/R/B/Y draw color, or a per-category/custom brush we render
      // existing shapes with — only the former is a real color change made by the user just now.
      return {
        from_square,
        to_square,
        color: prev?.category ? prev.color : brushToColor(s.brush),
        category: prev?.category ?? null,
        comment: prev?.comment ?? null,
        line_style: prev?.line_style ?? 'solid',
        order: prev?.order ?? null,
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
        line_style: prev?.line_style ?? 'solid',
        fill: prev?.fill ?? false,
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

  const shapes = toDrawShapes(arrows, circles, orientation)
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
