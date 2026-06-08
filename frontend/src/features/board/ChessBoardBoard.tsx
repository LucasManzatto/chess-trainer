import { useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { DrawBrush, DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import { useChessBoardStore, useChessBoardStoreApi } from './store/chessBoardStore'
import { getCurrentFen } from './store/slices/gameSlice'
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

type HistoryEntry = { san: string; fen: string; from: string; to: string }

type ConfigParams = {
  fen: string
  orientation: 'white' | 'black'
  turn: 'white' | 'black'
  chess: Chess
  interactive: boolean
  dests: Dests
  lastEntry: HistoryEntry | undefined
  shapes: DrawShape[] | undefined
  extraBrushes: Record<string, DrawBrush>
  onMove: (orig: Key, dest: Key) => void
}

// ─── Game state helpers ───────────────────────────────────────────────────────

function getTurn(chess: Chess): 'white' | 'black' {
  return chess.turn() === 'w' ? 'white' : 'black'
}

function getLastEntry(history: HistoryEntry[], currentMoveIndex: number): HistoryEntry | undefined {
  return currentMoveIndex >= 0 ? history[currentMoveIndex] : undefined
}

function getDests(chess: Chess, interactive: boolean): Dests {
  const map: Dests = new Map()
  if (!interactive) return map
  for (const move of chess.moves({ verbose: true })) {
    const list = map.get(move.from as Key) ?? []
    list.push(move.to as Key)
    map.set(move.from as Key, list)
  }
  return map
}

// ─── Board config helpers ─────────────────────────────────────────────────────

function getAllShapes(shapes: DrawShape[], hintShapes: DrawShape[], evalBestMove: string | undefined, showBestMove: boolean): DrawShape[] {
  const bestMoveShape: DrawShape[] = showBestMove && evalBestMove
    ? [{ orig: evalBestMove.slice(0, 2) as Key, dest: evalBestMove.slice(2, 4) as Key, brush: 'eval' }]
    : []
  return [...shapes, ...hintShapes, ...bestMoveShape]
}

function getConfig({ fen, orientation, turn, chess, interactive, dests, lastEntry, shapes, extraBrushes, onMove }: ConfigParams): Config {
  return {
    fen,
    orientation,
    turnColor: turn,
    check: chess.inCheck(),
    lastMove: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] : undefined,
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
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type ChessBoardBoardProps = {
  overlay?: ReactNode
}

export function ChessBoardBoard({ overlay }: ChessBoardBoardProps = {}) {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const store = useChessBoardStoreApi()

  const history = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const orientation = useChessBoardStore(s => s.orientation)
  const interactive = useChessBoardStore(s => s.interactive)
  const shapes = useChessBoardStore(s => s.shapes)
  const hintShapes = useChessBoardStore(s => s.hintShapes)
  const hintBrushes = useChessBoardStore(s => s.hintBrushes)
  const fen = useChessBoardStore(getCurrentFen)
  const boardSize = useBoardSettings(s => s.boardSize)
  const showBestMove = useBoardSettings(s => s.showBestMove)
  const evalBestMove = useChessBoardStore(s => s.evalBestMove)
  const chess = useMemo(() => new Chess(fen), [fen])
  const turn = getTurn(chess)
  const dests = useMemo(() => getDests(chess, interactive), [chess, interactive])
  const lastEntry = getLastEntry(history, currentMoveIndex)

  const onMoveHandler = useCallback(
    (orig: Key, dest: Key) => store.getState().applyMove(orig, dest),
    [store],
  )

  const allShapes = useMemo(
    () => getAllShapes(shapes, hintShapes, evalBestMove, showBestMove),
    [shapes, hintShapes, evalBestMove, showBestMove],
  )

  const config = useMemo(
    () => getConfig({ fen, orientation, turn, chess, interactive, dests, lastEntry, shapes: allShapes, extraBrushes: hintBrushes, onMove: onMoveHandler }),
    [fen, orientation, turn, chess, interactive, dests, lastEntry, allShapes, hintBrushes, onMoveHandler],
  )

  // Init once
  useEffect(() => {
    if (!elRef.current) return
    apiRef.current = Chessground(elRef.current, config)
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync config updates
  useEffect(() => {
    apiRef.current?.set(config)
  }, [config])

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

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: boardSize, height: boardSize }} />
      {overlay}
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
