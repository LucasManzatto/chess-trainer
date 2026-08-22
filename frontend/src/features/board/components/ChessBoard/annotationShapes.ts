// Pure conversion between our annotation model (BoardAnnotationArrow/Circle) and chessground's
// DrawShape/DrawBrushes — geometry, SVG generation, and hover-highlight math. No React, no chessground
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

// Shapes to draw plus the brushes they reference.
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

  // Registers (or reuses) the brush for one (isGhost, hex) combination and returns its key.
  // Opacity is always BASE_SHAPE_OPACITY (no per-shape dimming), so it's baked into the brush
  // table directly rather than threaded through here. lineWidth is deliberately NOT part of this
  // either: chessground's own DrawShape.modifiers already carries a per-shape lineWidth override
  // (see arrowShapes below), so baking it into the brush too would just fragment the brush cache
  // for no benefit.
  const ensureBrush = (isGhost: boolean, hex: string): string => {
    const key = `annotation-${isGhost ? 'ghost' : hex}`
    if (!brushes[key]) {
      // Ghost shapes must stay 'transparent', not just opacity: 0 — chessground's own opacity()
      // helper does `brush.opacity || 1`, so a literal 0 falls back to full opacity 1. Without a
      // transparent color that fallback would render the hidden native line at full strength,
      // permanently masking this shape's customSvg underneath.
      //
      // Known tradeoff: native opacity only applies to the <line>, not the <marker> arrowhead
      // (SVG markers don't inherit the referencing element's opacity), so the shaft sits at
      // BASE_SHAPE_OPACITY while the head stays full-strength — visible as a seam where the two
      // meet. Accepted rather than baking opacity into the color as an alpha byte.
      brushes[key] = { key, color: isGhost ? 'transparent' : hex, opacity: BASE_SHAPE_OPACITY, lineWidth: BASE_LINE_WIDTH }
    }
    return key
  }

  const arrowShapes = arrows.map(a => {
    const hex = resolveHex(a.color, a.category)
    const { angle, lengthSquares } = arrowGeometry(a.from_square, a.to_square, orientation)
    const isGhost = arrowBrushKey(a.color, a.category, a.line_style) === GHOST_BRUSH_KEY
    const lineWidth = hoverLineWidth(arrowKey(a), hoveredKey)
    const brushKey = ensureBrush(isGhost, hex)
    const { customSvg: rawCustomSvg, label } = arrowOverlay(hex, a.category, a.order, a.line_style, angle, lengthSquares)
    return {
      orig: a.from_square as Key,
      dest: a.to_square as Key,
      brush: brushKey,
      // Native override for this one shape's width, instead of a dedicated brush per width —
      // chessground merges this into the rendered line + arrowhead marker (see makeCustomBrush
      // in its svg.ts) and folds it into its own redraw-cache hash automatically.
      //
      // NOT using `hilite` here: chessground's renderArrow draws it as a *second*, blurred
      // backdrop line+arrowhead layered behind the normal one. The blur spreads that backdrop
      // wider than the crisp solid arrowhead on top, so it shows through as a stray line inside/
      // around the arrowhead. lineWidth alone is enough of a hover cue without that artifact.
      modifiers: { lineWidth },
      label,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html) },
    }
  })
  const circleShapes = circles.map(c => {
    const hex = resolveHex(c.color, c.category)
    const isGhost = circleBrushKey(c.color, c.category, c.line_style, c.fill) === GHOST_BRUSH_KEY
    const brushKey = ensureBrush(isGhost, hex)
    const rawCustomSvg = circleCustomSvg(hex, c.category, c.line_style, c.fill)
    return {
      orig: c.square as Key,
      brush: brushKey,
      customSvg: rawCustomSvg && { ...rawCustomSvg, html: svgOpacityWrap(rawCustomSvg.html) },
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

// Arrow's own lineWidth given the currently hovered annotation key (from AnnotationsList or
// from hovering the shape itself on the board) — widens only the hovered arrow, as the highlight
// cue. Feeds into the shape's native `modifiers.lineWidth` (see toDrawShapes).
function hoverLineWidth(key: string, hoveredKey: string | null | undefined): number {
  return hoveredKey != null && key === hoveredKey ? HOVERED_LINE_WIDTH : BASE_LINE_WIDTH
}

// customSvg is drawn on top of the native brush at full alpha regardless of the brush's own
// opacity, so a custom-drawn shape (dashed/dotted arrows, filled squares, glyphs, order badges)
// needs its own wrapper to sit at the same BASE_SHAPE_OPACITY as everything else.
function svgOpacityWrap(html: string): string {
  return `<g opacity="${BASE_SHAPE_OPACITY}">${html}</g>`
}

// Arrow overlay content: category glyph (customSvg, always hand-drawn — no native equivalent)
// and the order-number badge, which prefers chessground's own `label` field when it can.
//
// Native `label` gets chessground's built-in multi-arrow collision avoidance for free (its
// labelCoords/slot math in svg.ts nudges the badge clear of other arrows converging on the same
// square). A categorized arrow keeps the old hand-positioned combo (glyph + badge offset from
// each other) regardless, since native label and the glyph would otherwise land on the same spot
// with no collision avoidance between the two of *our* elements.
function arrowOverlay(
  hex: string,
  category: BoardAnnotationArrow['category'],
  order: number | null,
  lineStyle: AnnotationLineStyle,
  angle: number,
  lengthSquares: number,
): { customSvg: DrawShape['customSvg']; label: DrawShape['label'] } {
  const glyph = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null
  const useNativeLabel = order != null && !glyph
  // fill omitted — chessground's renderShape defaults label.fill to the shape's own brush color
  // (plain, opaque `hex`, same value this arrow resolved to), so passing it here would just
  // restate that.
  const label: DrawShape['label'] = useNativeLabel ? { text: String(order) } : undefined
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
