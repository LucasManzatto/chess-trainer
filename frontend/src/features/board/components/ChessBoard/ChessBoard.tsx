import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
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
  arrowKey,
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
  // Key (arrowKey / circle square) of the annotation currently hovered in AnnotationsList —
  // that annotation is drawn at full strength, every other shape dims. Undefined/null = no dim.
  hoveredKey?: string | null
  actions: {
    applyMove: (orig: Square, dest: Square) => void
    navigateBack: () => void
    navigateForward: () => void
    onDrawableChange?: (arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]) => void
    // Fires as the pointer moves over an annotated square/arrow on the board (its arrowKey /
    // circle square), and with null on leaving it — drives the reverse of hoveredKey, so
    // hovering a shape on the board highlights its row in AnnotationsList.
    onHoverEntry?: (key: string | null) => void
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

// Opacity a non-hovered shape falls to while another annotation is hovered (in the list or on
// the board itself) — low enough to read as "not this one" without vanishing entirely, so the
// board doesn't jump around as the pointer moves.
const DIMMED_OPACITY = 0.15
// Native brush opacity/lineWidth shapes render at outside of any hover (unchanged behavior).
const BASE_SHAPE_OPACITY = 0.9
const BASE_LINE_WIDTH = 10
const HOVERED_LINE_WIDTH = 13

// customSvg is drawn on top of the native brush at full alpha regardless of the brush's own
// opacity, so dimming a custom-drawn shape (dashed/dotted arrows, filled squares, glyphs, order
// badges) needs its own wrapper — this is that wrapper.
function svgOpacityWrap(html: string, opacity: number): string {
  return opacity === 1 ? html : `<g opacity="${opacity}">${html}</g>`
}

// Per-shape opacity/lineWidth given the currently hovered annotation key (from AnnotationsList
// or from hovering the shape itself on the board) — full strength when nothing is hovered or
// this shape is the hovered one, dimmed otherwise.
function shapeHoverState(key: string, hoveredKey: string | null | undefined): { opacity: number; lineWidth: number } {
  if (!hoveredKey) return { opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH }
  return key === hoveredKey
    ? { opacity: BASE_SHAPE_OPACITY, lineWidth: HOVERED_LINE_WIDTH }
    : { opacity: BASE_SHAPE_OPACITY * DIMMED_OPACITY, lineWidth: BASE_LINE_WIDTH }
}

// customSvg's 1×1 embedded box (viewBox 0 0 100 100) covers exactly one board square, so
// 100 local units == 1 square, regardless of which point (orig/dest/label) it's anchored to.
const SQUARE_UNITS = 100

function squareFileRank(square: string): [number, number] {
  return [square.charCodeAt(0) - 97, Number(square[1]) - 1]
}

// Inverse of squareFileRank's screen mapping: which square a point in the board element's own
// pixel space (0,0 top-left) falls on, accounting for orientation. Powers hover-detection over
// drawn shapes, which chessground's own SVG layer doesn't expose pointer events for.
function pointToSquare(x: number, y: number, boardSize: number, orientation: 'white' | 'black'): string | null {
  if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null
  const cell = boardSize / 8
  let file = Math.floor(x / cell)
  let rank = 7 - Math.floor(y / cell)
  if (orientation === 'black') { file = 7 - file; rank = 7 - rank }
  return String.fromCharCode(97 + file) + (rank + 1)
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

// Shapes to draw plus the brushes they reference — brushes are generated per-shape (not the
// shared SOLID_BRUSHES map) because dimming one hovered-elsewhere shape without touching every
// other shape of the same color/category requires each shape to own its opacity/lineWidth.
function toDrawShapes(
  arrows: BoardAnnotationArrow[],
  circles: BoardAnnotationCircle[],
  orientation: 'white' | 'black',
  hoveredKey: string | null | undefined,
): { shapes: DrawShape[]; brushes: DrawBrushes } {
  // Start from the base G/R/B/Y + category brushes — chessground still needs these under their
  // plain keys to resolve the color a user picks (via modifier key) while freehand-drawing a
  // new arrow/circle directly on the board, before it becomes one of our own annotations below.
  const brushes: Record<string, { key: string; color: string; opacity: number; lineWidth: number }> = { ...SOLID_BRUSHES }

  const arrowShapes = arrows.map((a, i) => {
    const hex = SOLID_BRUSHES[baseBrushKey(a.color, a.category)]?.color ?? a.color
    const { angle, lengthSquares } = arrowGeometry(a.from_square, a.to_square, orientation)
    const isGhost = arrowBrushKey(a.color, a.category, a.line_style) === GHOST_BRUSH_KEY
    const { opacity, lineWidth } = shapeHoverState(arrowKey(a), hoveredKey)
    // chessground skips redrawing a shape whose {orig,dest,brush,customSvg,...} hash is
    // unchanged from last render (see its shapeHash/prevSvgHash) — it never looks at whether
    // the *brush definition* a shape's brush key resolves to has changed. A plain solid arrow
    // has no customSvg to pick up the opacity change either, so the brush key itself must carry
    // the hover state, or hovering would silently no-op on every solid arrow.
    const brushKey = `arrow-${i}-${opacity}-${lineWidth}`
    // Ghost shapes must stay 'transparent', not just opacity: 0 — chessground's own opacity()
    // helper does `brush.opacity || 1`, so a literal 0 falls back to full opacity 1. Without a
    // transparent color that fallback would render the hidden native line at full strength,
    // permanently masking this shape's actual (correctly dimming) customSvg opacity.
    brushes[brushKey] = { key: brushKey, color: isGhost ? 'transparent' : hex, opacity: isGhost ? 0 : opacity, lineWidth }
    const rawCustomSvg = arrowCustomSvg(hex, a.category, a.order, a.line_style, angle, lengthSquares)
    return {
      orig: a.from_square as Key,
      dest: a.to_square as Key,
      brush: brushKey,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html, opacity) },
    }
  })
  const circleShapes = circles.map((c, i) => {
    const hex = SOLID_BRUSHES[baseBrushKey(c.color, c.category)]?.color ?? c.color
    const isGhost = circleBrushKey(c.color, c.category, c.line_style, c.fill) === GHOST_BRUSH_KEY
    const { opacity, lineWidth } = shapeHoverState(c.square, hoveredKey)
    const brushKey = `circle-${i}-${opacity}-${lineWidth}`
    brushes[brushKey] = { key: brushKey, color: isGhost ? 'transparent' : hex, opacity: isGhost ? 0 : opacity, lineWidth }
    const rawCustomSvg = circleCustomSvg(hex, c.category, c.line_style, c.fill)
    return {
      orig: c.square as Key,
      brush: brushKey,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html, opacity) },
    }
  })

  return { shapes: [...arrowShapes, ...circleShapes], brushes: brushes as unknown as DrawBrushes }
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
        line_id: prev?.line_id ?? null,
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

// Position-derived facts chessground needs: whose turn, is it check, and (only while
// interactive) the legal-move destinations map that drives move highlighting/restriction.
function useChessPosition(fen: string, interactive: boolean) {
  const chess = new Chess(fen)
  const turn = chess.turn() === 'w' ? 'white' as const : 'black' as const
  const check = chess.inCheck()
  const dests = interactive ? getDests(chess.moves({ verbose: true })) : new Map()
  return { turn, check, dests }
}

// Everything chessground needs for its `drawable` config: shapes to render, brushes to
// render them with, and the reverse conversion (drawn shapes → our annotation shape) fed
// back to the caller on change.
function useDrawable(
  arrows: ChessBoardProps['arrows'],
  circles: ChessBoardProps['circles'],
  orientation: 'white' | 'black',
  hoveredKey: string | null | undefined,
  onAnnotationsChange: NonNullable<ChessBoardProps['actions']['onDrawableChange']>,
): Config['drawable'] {
  const { shapes, brushes } = toDrawShapes(arrows, circles, orientation, hoveredKey)

  function onChange(next: DrawShape[]) {
    const { arrows: nextArrows, circles: nextCircles } = fromDrawShapes(next, arrows, circles)
    onAnnotationsChange(nextArrows, nextCircles)
  }

  return { shapes, brushes, onChange }
}

function useBoardConfig(
  state: ChessBoardProps['state'],
  arrows: ChessBoardProps['arrows'],
  circles: ChessBoardProps['circles'],
  hoveredKey: string | null | undefined,
  actions: ChessBoardProps['actions'],
): Config {
  const { fen, orientation, interactive, lastMove } = state
  const { applyMove, onDrawableChange: onAnnotationsChange = noop } = actions

  const { turn, check, dests } = useChessPosition(fen, interactive)
  const drawable = useDrawable(arrows, circles, orientation, hoveredKey, onAnnotationsChange)

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
    drawable,
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
}

// Mounts the chessground instance on `elRef` once, then keeps it in sync with `config` on
// every change. Destroys it on unmount.
function useChessgroundInstance(config: Config) {
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

  return { elRef, apiRef }
}

// Chessground caches its bounding rect and only invalidates it on its own ResizeObserver
// (size change), window resize, or scroll — none of which fire when a sibling panel's width
// transitions and shifts the board sideways without resizing it. Recompute bounds once that
// transition ends. Kept separate from mount/sync: a layout quirk, not lifecycle management.
function useChessgroundResizeFix(apiRef: RefObject<Api | null>) {
  useEffect(() => {
    function onTransitionEnd(e: TransitionEvent) {
      if (e.propertyName === 'width') apiRef.current?.redrawAll()
    }
    window.addEventListener('transitionend', onTransitionEnd)
    return () => window.removeEventListener('transitionend', onTransitionEnd)
  }, [apiRef])
}

// Reverse of the list→board hover link: as the pointer moves over the board, works out which
// annotated square it's over and reports that shape's key (or null) so AnnotationsList can
// highlight the matching row. chessground's shapes are plain SVG with no pointer events of
// their own, so this hit-tests by geometry against the board element instead.
function useBoardHoverEntry(
  elRef: RefObject<HTMLDivElement | null>,
  arrows: ChessBoardProps['arrows'],
  circles: ChessBoardProps['circles'],
  orientation: 'white' | 'black',
  boardSize: number,
  onHoverEntry: ChessBoardProps['actions']['onHoverEntry'],
) {
  useEffect(() => {
    const el = elRef.current
    if (!el || !onHoverEntry) return

    function keyAtSquare(square: string): string | null {
      const arrow = arrows.find(a => a.from_square === square || a.to_square === square)
      if (arrow) return arrowKey(arrow)
      return circles.find(c => c.square === square)?.square ?? null
    }
    function onPointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const square = pointToSquare(e.clientX - rect.left, e.clientY - rect.top, boardSize, orientation)
      onHoverEntry!(square ? keyAtSquare(square) : null)
    }
    function onPointerLeave() {
      onHoverEntry!(null)
    }

    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [elRef, arrows, circles, orientation, boardSize, onHoverEntry])
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
  const config = useBoardConfig(props.state, props.arrows, props.circles, props.hoveredKey, props.actions)
  const { elRef, apiRef } = useChessgroundInstance(config)
  useChessgroundResizeFix(apiRef)
  useBoardKeyNav(props.actions.navigateBack, props.actions.navigateForward)
  useBoardHoverEntry(elRef, props.arrows, props.circles, props.state.orientation, props.config.boardSize, props.actions.onHoverEntry)

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: props.config.boardSize, height: props.config.boardSize }} />
      {props.overlay}
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
