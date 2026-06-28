import { useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { DrawBrush, DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { useShallow } from 'zustand/shallow'
import { useChessBoardStore, useChessBoardStoreApi } from './store/chessBoardStore'
import { getCurrentFen } from './store/slices/gameSlice'
import { getLastMove, getTurn, getDests } from '../../lib/chess/gameUtils'
import { useBoardSettings } from './store/boardSettingsStore'

// ─── Constants ───────────────────────────────────────────────────────────────

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
  shapes: DrawShape[] | undefined
  extraBrushes: Record<string, DrawBrush>
  onMove: (orig: Key, dest: Key) => void
  onShapesChange: (shapes: DrawShape[]) => void
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getBestMoveShape(evalBestMove: string | undefined, showBestMove: boolean): DrawShape[] {
  if (!showBestMove || !evalBestMove) return []
  return [{ orig: evalBestMove.slice(0, 2) as Key, dest: evalBestMove.slice(2, 4) as Key, brush: 'eval' }]
}

function getConfig({ fen, orientation, turn, check, interactive, dests, lastMove, shapes, extraBrushes, onMove, onShapesChange }: ConfigParams): Config {
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
      events: { after: onMove },
    },
    drawable: {
      autoShapes: shapes,
      brushes: { ...BRUSHES, ...extraBrushes },
      onChange: onShapesChange,
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useBoardConfig(): Config {
  const store = useChessBoardStoreApi()

  const { fen, orientation, interactive, shapes, hintShapes, hintBrushes, evalBestMove, lastMove, setDrawnShapes } = useChessBoardStore(
    useShallow((s) => ({
      fen: getCurrentFen(s),
      orientation: s.orientation,
      interactive: s.interactive,
      shapes: s.shapes,
      hintShapes: s.hintShapes,
      hintBrushes: s.hintBrushes,
      evalBestMove: s.evalBestMove,
      lastMove: getLastMove(s),
      setDrawnShapes: s.setDrawnShapes,
    })),
  )
  const showBestMove = useBoardSettings(s => s.showBestMove)

  const chess = useMemo(() => new Chess(fen), [fen])
  const turn = useMemo(() => getTurn(chess), [chess])
  const check = useMemo(() => chess.inCheck(), [chess])
  const dests = useMemo(() => interactive ? getDests(chess) : new Map(), [chess, interactive])

  const onMove = useCallback(
    (orig: Key, dest: Key) => store.getState().applyMove(orig as Square, dest as Square),
    [store],
  )

  const bestMoveShape = useMemo(
    () => getBestMoveShape(evalBestMove, showBestMove),
    [evalBestMove, showBestMove],
  )

  const allShapes = useMemo(
    () => [...shapes, ...hintShapes, ...bestMoveShape],
    [shapes, hintShapes, bestMoveShape],
  )

  const config = useMemo(
    () => getConfig({ fen, orientation, turn, check, interactive, dests, lastMove, shapes: allShapes, extraBrushes: hintBrushes, onMove, onShapesChange: setDrawnShapes }),
    [fen, orientation, turn, check, interactive, dests, lastMove, allShapes, hintBrushes, onMove, setDrawnShapes],
  )

  return config
}

function useChessground(config: Config) {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const shapesClearSignal = useChessBoardStore(s => s.shapesClearSignal)

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

  useEffect(() => {
    if (shapesClearSignal > 0) apiRef.current?.set({ drawable: { shapes: [] } })
  }, [shapesClearSignal])

  return elRef
}

function useBoardKeyNav() {
  const navigateBack = useChessBoardStore(s => s.navigateBack)
  const navigateForward = useChessBoardStore(s => s.navigateForward)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target instanceof HTMLElement && e.target.isContentEditable)) return
      if (e.key === 'ArrowLeft') navigateBack()
      else if (e.key === 'ArrowRight') navigateForward()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateBack, navigateForward])
}

// ─── Component ────────────────────────────────────────────────────────────────

type ChessBoardBoardProps = {
  overlay?: ReactNode
}

export function ChessBoardBoard({ overlay }: ChessBoardBoardProps = {}) {
  const config = useBoardConfig()
  const elRef = useChessground(config)
  const boardSize = useBoardSettings(s => s.boardSize)
  useBoardKeyNav()

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: boardSize, height: boardSize }} />
      {overlay}
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
