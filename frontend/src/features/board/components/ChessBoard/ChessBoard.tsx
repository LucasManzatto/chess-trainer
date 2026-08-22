import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getDests } from '../../../../lib/chess/position'
import { arrowKey, type BoardAnnotationArrow, type BoardAnnotationCircle } from '../../types'
import { toDrawShapes, fromDrawShapes, pointToSquare } from './annotationShapes'

const noop = () => {}

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
