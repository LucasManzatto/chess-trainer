import { useEffect, useRef, useMemo, useCallback } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { Chess } from 'chess.js'
import { useChessBoardStore, useChessBoardStoreApi } from './store/chessBoardStore'

const INITIAL_FEN = new Chess().fen()

type HistoryEntry = { san: string; fen: string; from: string; to: string }

function getFenAtIndex(history: HistoryEntry[], index: number | null): string {
  if (history.length === 0 || index === -1) return INITIAL_FEN
  const target = index === null ? history.length - 1 : index
  return history[target]?.fen ?? INITIAL_FEN
}

function getTurn(chess: Chess): 'white' | 'black' {
  return chess.turn() === 'w' ? 'white' : 'black'
}

type ConfigParams = {
  fen: string
  orientation: 'white' | 'black'
  turn: 'white' | 'black'
  chess: Chess
  interactive: boolean
  dests: Dests
  lastEntry: HistoryEntry | undefined
  shapes: DrawShape[] | undefined
  onMove: (orig: Key, dest: Key) => void
}

function getConfig({ fen, orientation, turn, chess, interactive, dests, lastEntry, shapes, onMove }: ConfigParams): Config {
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
    drawable: { autoShapes: shapes },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }
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

export function ChessBoardBoard() {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const store = useChessBoardStoreApi()

  const history = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const orientation = useChessBoardStore(s => s.orientation)
  const interactive = useChessBoardStore(s => s.interactive)
  const shapes = useChessBoardStore(s => s.shapes)
  const lastExternalFen = useChessBoardStore(s => s.lastExternalFen)
  const boardSize = useChessBoardStore(s => s.boardSize)
  const evalBestMove = useChessBoardStore(s => s.evalBestMove)

  const fen = lastExternalFen ?? getFenAtIndex(history, currentMoveIndex)

  const chess = useMemo(() => new Chess(fen), [fen])
  const turn = getTurn(chess)

  const dests = useMemo(() => getDests(chess, interactive), [chess, interactive])

  const lastEntry = getLastEntry(history, currentMoveIndex)

  const onMoveHandler = useCallback(
    (orig: Key, dest: Key) => store.getState().applyMove(orig, dest),
    [store],
  )

  const allShapes = useMemo<DrawShape[]>(() => {
    const bestMoveShape: DrawShape[] = evalBestMove
      ? [{ orig: evalBestMove.slice(0, 2) as Key, dest: evalBestMove.slice(2, 4) as Key, brush: 'paleBlue' }]
      : []
    return [...shapes, ...bestMoveShape]
  }, [shapes, evalBestMove])

  const config = useMemo(
    () => getConfig({ fen, orientation, turn, chess, interactive, dests, lastEntry, shapes: allShapes, onMove: onMoveHandler }),
    [fen, orientation, turn, chess, interactive, dests, lastEntry, allShapes, onMoveHandler],
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

  return (
    <div className="relative">
      <div ref={elRef} style={{ width: boardSize, height: boardSize }} />
      {/* TODO: promotion dialog */}
      {/* TODO: threat overlay */}
    </div>
  )
}
