// Pure conversion between our annotation model (BoardAnnotationArrow/Circle) and chessground's
// DrawShape/DrawBrushes — geometry, SVG generation, and hover-dim math. No React, no chessground
// instance access, so it's testable and reusable standalone.
//
// Ordered top-down: constants → public API (toDrawShapes/fromDrawShapes/pointToSquare) →
// their helpers, each section closer to the leaves the one above calls into.

import type { Key } from '@lichess-org/chessground/types'
import type { DrawBrush, DrawBrushes, DrawShape } from '@lichess-org/chessground/draw'
import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CATEGORY_BY_VALUE,
  arrowKey,
  type AnnotationLineStyle,
  type BoardAnnotationArrow,
  type BoardAnnotationCircle,
} from '../../types'

// ─── Constants ───────────────────────────────────────────────────────────────

// Native brush opacity/lineWidth shapes render at outside of any hover (unchanged behavior).
// Declared first since BASE_BRUSHES/CATEGORY_BRUSHES below are defined in terms of it — avoids
// the same 0.9/10 magic numbers being duplicated (and able to drift) across the brush tables and
// the hand-drawn SVG strings further down.
const BASE_SHAPE_OPACITY = 0.9
const BASE_LINE_WIDTH = 10
const HOVERED_LINE_WIDTH = 13
// Opacity a non-hovered shape falls to while another annotation is hovered (in the list or on
// the board itself) — low enough to read as "not this one" without vanishing entirely, so the
// board doesn't jump around as the pointer moves. This is a multiplier on BASE_SHAPE_OPACITY, not
// the final rendered opacity (that's BASE_SHAPE_OPACITY * DIMMED_OPACITY, see shapeHoverState).
const DIMMED_OPACITY = 0.15

const BASE_BRUSHES = {
  green:  { key: 'green',  color: '#15781B', opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH },
  red:    { key: 'red',    color: '#882020', opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH },
  blue:   { key: 'blue',   color: '#003088', opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH },
  yellow: { key: 'yellow', color: '#e68f00', opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH },
  hint:   { key: 'hint',   color: '#15781B', opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH },
} as const

// One brush per category, keyed by category value, so a categorized arrow/circle is
// color-coded by category instead of the plain G/R/B/Y draw color.
const CATEGORY_BRUSHES = Object.fromEntries(
  ANNOTATION_CATEGORIES.map(c => [c.value, { key: c.value, color: c.fill, opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH }]),
)

// chessground's own brushes have no dash/fill support, so any shape that isn't a plain solid
// line/ring is drawn entirely by us via customSvg instead — this brush just keeps that shape's
// native rendering fully invisible.
const GHOST_BRUSH_KEY = 'annotation-custom'

const SOLID_BRUSHES: Record<string, DrawBrush> = {
  ...BASE_BRUSHES,
  ...CATEGORY_BRUSHES,
  [GHOST_BRUSH_KEY]: { key: GHOST_BRUSH_KEY, color: 'transparent', opacity: 0, lineWidth: 1 },
}

const COLOR_TO_BRUSH: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }
const BRUSH_TO_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_TO_BRUSH).map(([color, brush]) => [brush, color]),
)

const DASH_PATTERN: Record<'dashed' | 'dotted', string> = { dashed: '16 12', dotted: '2 12' }

// customSvg's 1×1 embedded box (viewBox 0 0 100 100) covers exactly one board square, so
// 100 local units == 1 square, regardless of which point (orig/dest/label) it's anchored to.
// Multi-square dashed arrows draw well outside this box (lengthSquares * SQUARE_UNITS local
// units) — that only works because SVG doesn't clip by default; chessground's customSvg wrapper
// must not add overflow:hidden for this to keep rendering correctly.
const SQUARE_UNITS = 100

// Fraction of an arrow's length (from orig) where its category glyph / order badge is anchored,
// for the dashed/dotted custom-drawn path — chosen so the glyph sits past the shaft's midpoint
// (closer to the arrowhead) and the badge sits near the base, clear of both endpoints.
const GLYPH_ANCHOR_FRACTION = 0.68
const ORDER_BADGE_ANCHOR_FRACTION = 0.18

// ─── Public API ─────────────────────────────────────────────────────────────

// Shapes to draw plus the brushes they reference — brushes are generated per distinct
// (color, opacity, lineWidth) combination actually in use (not the shared SOLID_BRUSHES map)
// because dimming one hovered-elsewhere shape without touching every other shape of the same
// color/category requires that shape to own its own opacity/lineWidth.
export function toDrawShapes(
  arrows: BoardAnnotationArrow[],
  circles: BoardAnnotationCircle[],
  orientation: 'white' | 'black',
  hoveredKey: string | null | undefined,
): { shapes: DrawShape[]; brushes: DrawBrushes } {
  // Start from the base G/R/B/Y + category brushes — chessground still needs these under their
  // plain keys to resolve the color a user picks (via modifier key) while freehand-drawing a
  // new arrow/circle directly on the board, before it becomes one of our own annotations below.
  // DrawBrushes requires green/red/blue/yellow, which SOLID_BRUSHES already carries via
  // BASE_BRUSHES, so this satisfies the type directly — no cast needed.
  const brushes: DrawBrushes = { ...SOLID_BRUSHES } as DrawBrushes

  // Registers (or reuses) the brush for one (isGhost, hex, opacity) combination and returns its
  // key. Shapes that land on the same combination — the common case: most shapes share the same
  // base opacity when nothing is hovered — share one brush entry instead of minting a new one
  // per shape. lineWidth is deliberately NOT part of this: chessground's own DrawShape.modifiers
  // already carries a per-shape lineWidth override (see arrowShapes below), so baking it into the
  // brush too would just fragment the brush cache for no benefit.
  const ensureBrush = (isGhost: boolean, hex: string, opacity: number): string => {
    const key = `annotation-${isGhost ? 'ghost' : hex}-${opacity}`
    if (!brushes[key]) {
      // chessground's shapeHash (see its svg.ts) includes both `brush` (this key) and
      // `modifiers` directly, so either one changing is enough to bust its redraw cache on its
      // own — the brush key doesn't need to carry lineWidth too just to force a redraw.
      //
      // Ghost shapes must stay 'transparent', not just opacity: 0 — chessground's own opacity()
      // helper does `brush.opacity || 1`, so a literal 0 falls back to full opacity 1. Without a
      // transparent color that fallback would render the hidden native line at full strength,
      // permanently masking this shape's actual (correctly dimming) customSvg opacity. Non-ghost
      // shapes bake opacity into the color itself (see hexWithOpacity) rather than the brush's own
      // opacity field, since that field only dims the shaft — the arrowhead marker ignores it.
      brushes[key] = { key, color: isGhost ? 'transparent' : hexWithOpacity(hex, opacity), opacity: 1, lineWidth: BASE_LINE_WIDTH }
    }
    return key
  }

  const arrowShapes = arrows.map(a => {
    const hex = resolveHex(a.color, a.category)
    const { angle, lengthSquares } = arrowGeometry(a.from_square, a.to_square, orientation)
    const isGhost = arrowBrushKey(a.color, a.category, a.line_style) === GHOST_BRUSH_KEY
    const key = arrowKey(a)
    const isHovered = hoveredKey != null && key === hoveredKey
    const isDimmed = hoveredKey != null && key !== hoveredKey
    const { opacity, lineWidth } = shapeHoverState(key, hoveredKey)
    const brushKey = ensureBrush(isGhost, hex, opacity)
    const { customSvg: rawCustomSvg, label } = arrowOverlay(hex, a.category, a.order, a.line_style, angle, lengthSquares, isDimmed)
    return {
      orig: a.from_square as Key,
      dest: a.to_square as Key,
      brush: brushKey,
      // Native override for this one shape's width, instead of a dedicated brush per width —
      // chessground merges this into the rendered line + arrowhead marker (see makeCustomBrush
      // in its svg.ts) and folds it into its own redraw-cache hash automatically. `hilite` is
      // chessground's own "this one's highlighted" primitive (a blurred glow behind the line) —
      // safe to use only for the actually-hovered arrow, since renderArrow forces opacity to 1
      // whenever hilite is set, which is already this shape's own state.
      modifiers: isHovered ? { lineWidth, hilite: hex } : { lineWidth },
      label,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html, opacity) },
    }
  })
  const circleShapes = circles.map(c => {
    const hex = resolveHex(c.color, c.category)
    const isGhost = circleBrushKey(c.color, c.category, c.line_style, c.fill) === GHOST_BRUSH_KEY
    // Circles have no hover-width cue: chessground's renderCircle draws its ring at a fixed
    // width from its own circleWidth() constant and never reads brush.lineWidth or
    // shape.modifiers — so unlike arrows, there is nothing to widen here. Opacity is the only
    // lever; only that is used below.
    const { opacity } = shapeHoverState(c.square, hoveredKey)
    const brushKey = ensureBrush(isGhost, hex, opacity)
    const rawCustomSvg = circleCustomSvg(hex, c.category, c.line_style, c.fill)
    return {
      orig: c.square as Key,
      brush: brushKey,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html, opacity) },
    }
  })

  return { shapes: [...arrowShapes, ...circleShapes], brushes }
}

export function fromDrawShapes(
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

// Inverse of squareFileRank's screen mapping: which square a point in the board element's own
// pixel space (0,0 top-left) falls on, accounting for orientation. Powers hover-detection over
// drawn shapes, which chessground's own SVG layer doesn't expose pointer events for.
export function pointToSquare(x: number, y: number, boardSize: number, orientation: 'white' | 'black'): string | null {
  if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null
  const cell = boardSize / 8
  let file = Math.floor(x / cell)
  let rank = 7 - Math.floor(y / cell)
  if (orientation === 'black') { file = 7 - file; rank = 7 - rank }
  return String.fromCharCode(97 + file) + (rank + 1)
}

// ─── toDrawShapes helpers ───────────────────────────────────────────────────

function baseBrushKey(color: string, category: BoardAnnotationArrow['category']): string {
  return category ?? COLOR_TO_BRUSH[color] ?? color
}

// Hex fill color for an arrow/circle's category (if any) or its raw G/R/B/Y draw color,
// shared by both the arrow and circle branches of toDrawShapes.
function resolveHex(color: string, category: BoardAnnotationArrow['category']): string {
  return SOLID_BRUSHES[baseBrushKey(color, category)]?.color ?? color
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

// Per-shape opacity/lineWidth given the currently hovered annotation key (from AnnotationsList
// or from hovering the shape itself on the board) — full strength when nothing is hovered or
// this shape is the hovered one, dimmed otherwise. Callers feed `opacity` into the shape's brush
// color and `lineWidth` into its native `modifiers.lineWidth` (arrows only — see toDrawShapes).
function shapeHoverState(key: string, hoveredKey: string | null | undefined): { opacity: number; lineWidth: number } {
  if (!hoveredKey) return { opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH }
  return key === hoveredKey
    ? { opacity: BASE_SHAPE_OPACITY, lineWidth: HOVERED_LINE_WIDTH }
    : { opacity: BASE_SHAPE_OPACITY * DIMMED_OPACITY, lineWidth: BASE_LINE_WIDTH }
}

// A native arrow's head is an SVG <marker> referenced via marker-end — markers don't inherit
// the referencing line's `opacity` attribute (an SVG quirk), only their own fill. Baking the
// opacity into the color itself (as an 8-digit hex alpha channel) dims the shaft and the
// arrowhead together, instead of leaving the arrowhead permanently at full strength.
function hexWithOpacity(hex: string, opacity: number): string {
  // resolveHex only ever returns a brush-table color (always #rrggbb) or, in principle, a raw
  // a.color that failed to resolve — guard against appending an alpha byte to something that
  // isn't 6-digit hex, which would otherwise silently produce an invalid CSS color.
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255).toString(16).padStart(2, '0')
  return `${hex}${alpha}`
}

// customSvg is drawn on top of the native brush at full alpha regardless of the brush's own
// opacity, so dimming a custom-drawn shape (dashed/dotted arrows, filled squares, glyphs, order
// badges) needs its own wrapper — this is that wrapper.
function svgOpacityWrap(html: string, opacity: number): string {
  return opacity === 1 ? html : `<g opacity="${opacity}">${html}</g>`
}

// Arrow overlay content: category glyph (customSvg, always hand-drawn — no native equivalent)
// and the order-number badge, which prefers chessground's own `label` field when it can.
//
// Native `label` gets chessground's built-in multi-arrow collision avoidance for free (its
// labelCoords/slot math in svg.ts nudges the badge clear of other arrows converging on the same
// square) — but renderLabel never applies opacity, so a native label on a dimmed arrow would
// stay full-bright while the rest of the shape fades, breaking the hover-dim language. It's only
// used when `isDimmed` is false. A categorized arrow keeps the old hand-positioned combo (glyph +
// badge offset from each other) even when not dimmed, since native label and the glyph would
// otherwise land on the same spot with no collision avoidance between the two of *our* elements.
function arrowOverlay(
  hex: string,
  category: BoardAnnotationArrow['category'],
  order: number | null,
  lineStyle: AnnotationLineStyle,
  angle: number,
  lengthSquares: number,
  isDimmed: boolean,
): { customSvg: DrawShape['customSvg']; label: DrawShape['label'] } {
  const glyph = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null
  const useNativeLabel = order != null && !glyph && !isDimmed
  const label: DrawShape['label'] = useNativeLabel ? { text: String(order), fill: hex } : undefined
  const inlineOrder = order != null && !useNativeLabel

  if (lineStyle === 'solid') {
    if (!glyph && !inlineOrder) return { customSvg: undefined, label }
    let html = glyph ? categoryGlyphSvg(glyph.glyph, glyph.fill) : ''
    if (inlineOrder) html += orderBadgeSvg(order!, hex, 20, 20)
    return { customSvg: { center: 'label', html }, label }
  }

  const lengthLocal = lengthSquares * SQUARE_UNITS
  let html = dashedArrowShaftSvg(hex, angle, lengthLocal, lineStyle)
  if (glyph) {
    html += categoryGlyphSvg(
      glyph.glyph,
      glyph.fill,
      50 + Math.cos(angle) * lengthLocal * GLYPH_ANCHOR_FRACTION,
      50 + Math.sin(angle) * lengthLocal * GLYPH_ANCHOR_FRACTION,
    )
  }
  if (inlineOrder) {
    html += orderBadgeSvg(
      order!,
      hex,
      50 + Math.cos(angle) * lengthLocal * ORDER_BADGE_ANCHOR_FRACTION,
      50 + Math.sin(angle) * lengthLocal * ORDER_BADGE_ANCHOR_FRACTION,
    )
  }
  return { customSvg: { center: 'orig', html }, label }
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
    : `<circle cx="50" cy="50" r="42" fill="none" stroke="${hex}" stroke-width="8" ${lineStyle === 'dashed' || lineStyle === 'dotted' ? `stroke-dasharray="${DASH_PATTERN[lineStyle]}"` : ''} opacity="${BASE_SHAPE_OPACITY}" />`
  const html = shapeSvg + (glyph ? categoryGlyphSvg(glyph.glyph, glyph.fill) : '')
  return { center: 'orig', html }
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
    <line x1="50" y1="50" x2="${shaftX}" y2="${shaftY}" stroke="${hex}" stroke-width="${BASE_LINE_WIDTH}"
      stroke-linecap="round" stroke-dasharray="${DASH_PATTERN[lineStyle]}" opacity="${BASE_SHAPE_OPACITY}" />
    <polygon points="${tipX},${tipY} ${shaftX + wingX},${shaftY + wingY} ${shaftX - wingX},${shaftY - wingY}" fill="${hex}" opacity="${BASE_SHAPE_OPACITY}" />
  `
}

// Escapes text dropped into raw SVG markup. ANNOTATION_CATEGORIES glyphs are fixed internal
// constants today, never user input, but customSvg is plain string concatenation with no other
// sanitization layer — cheap insurance against a future glyph (or `order`, though that's numeric)
// containing '<' or '&' and corrupting the surrounding markup.
function escapeSvgText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Glyph drawn as plain outlined text directly on the shape (no separate badge circle) so it
// reads as printed on the shape itself, not overlaid on top of it.
const categoryGlyphSvg = (glyph: string, fill: string, x = 50, y = 58) =>
  `<text x="${x}" y="${y}" font-size="30" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff" stroke="${fill}" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${escapeSvgText(glyph)}</text>`

// Small numbered badge — depicts an arrow's step in a multi-move plan (1, 2, 3, …).
const orderBadgeSvg = (order: number, fill: string, x: number, y: number) => `
  <circle cx="${x}" cy="${y}" r="13" fill="${fill}" stroke="#fff" stroke-width="2" />
  <text x="${x}" y="${y + 5}" font-size="15" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">${order}</text>
`

function squareFileRank(square: string): [number, number] {
  return [square.charCodeAt(0) - 97, Number(square[1]) - 1]
}

// ─── fromDrawShapes helpers ─────────────────────────────────────────────────

function brushToColor(brush: string | undefined): string {
  return BRUSH_TO_COLOR[brush ?? 'green'] ?? 'G'
}

function isArrowShape(shape: DrawShape): boolean {
  return !!shape.dest && shape.dest !== shape.orig
}
