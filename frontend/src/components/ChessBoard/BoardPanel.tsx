import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Config } from '@lichess-org/chessground/config'
import type { Key, Dests } from '@lichess-org/chessground/types'
import { EvaluationBar } from './EvaluationBar'
import { usePositionEvaluation } from './hooks/usePositionEvaluation'
import { useBoardSettingsStore } from './stores/boardSettingsStore'
import { useChessStore, useChessStoreApi } from './stores/chessStore'
import { CloseIcon, EyeIcon, FlipIcon, GearIcon, HangingPieceIcon, PinnedPieceIcon } from '../icons'
import { ChessBoard } from './ChessBoard'
import { squareToPixel } from './utils'
import type { EvaluationScore, ThreatSquares } from './types'
import { getFenAtIndex } from '../../chess/game'
import { computeThreats } from '../../chess/analysis'

const EVAL_BAR_WIDTH = 16
const GEAR_BUTTON_WIDTH = 28
const DOT_SIZE = 22
const BOARD_PRESETS = [350, 450, 550, 700] as const
const BOARD_PRESET_LABELS = ['S', 'M', 'L', 'XL'] as const
const EMPTY_THREATS: ThreatSquares = { hanging: [], pinned: [] }

function useBoardConfig() {
  const history = useChessStore(s => s.history)
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex)
  const orientation = useChessStore(s => s.orientation)
  const store = useChessStoreApi()

  const chess = useMemo(
    () => new Chess(getFenAtIndex(history, currentMoveIndex)),
    [history, currentMoveIndex],
  )

  const turn: 'white' | 'black' = chess.turn() === 'w' ? 'white' : 'black'

  const dests = useMemo(() => {
    const map: Dests = new Map()
    for (const move of chess.moves({ verbose: true })) {
      const list = map.get(move.from as Key) ?? []
      list.push(move.to as Key)
      map.set(move.from as Key, list)
    }
    return map
  }, [chess])

  const lastEntry = currentMoveIndex >= 0 ? history[currentMoveIndex] : undefined

  const config = useMemo((): Config => ({
    fen: chess.fen(),
    orientation,
    turnColor: turn,
    check: chess.inCheck(),
    lastMove: lastEntry ? [lastEntry.from as Key, lastEntry.to as Key] : undefined,
    movable: {
      free: false,
      color: turn,
      dests,
      showDests: true,
      events: {
        after: (orig, dest) => store.getState().applyMove(orig, dest),
      },
    },
    animation: { enabled: true, duration: 300 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
  }), [chess, orientation, turn, dests, lastEntry, store])

  const threats: ThreatSquares = lastEntry ? computeThreats(lastEntry.fen) : EMPTY_THREATS

  return { config, threats, orientation }
}

function ThreatOverlay({ threats, boardSize, orientation }: {
  threats: ThreatSquares
  boardSize: number
  orientation: 'white' | 'black'
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {threats.hanging.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation, DOT_SIZE)
        return (
          <div key={`h-${sq}`} className="absolute drop-shadow-md" style={{ width: DOT_SIZE, height: DOT_SIZE, left, top }}>
            <HangingPieceIcon />
          </div>
        )
      })}
      {threats.pinned.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation, DOT_SIZE)
        return (
          <div key={`p-${sq}`} className="absolute drop-shadow-md" style={{ width: DOT_SIZE, height: DOT_SIZE, left, top }}>
            <PinnedPieceIcon />
          </div>
        )
      })}
    </div>
  )
}

function BoardSettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { size, setSize } = useBoardSettingsStore()

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-72 bg-gray-950 border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-250 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.08] flex-shrink-0">
          <span className="text-sm font-semibold text-white">Board Settings</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Board Size</span>
              <span className="text-xs text-gray-300 tabular-nums">{size}px</span>
            </div>
            <input
              type="range"
              min={300}
              max={800}
              step={10}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>300</span>
              <span>800</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Presets</div>
            <div className="grid grid-cols-4 gap-2">
              {BOARD_PRESETS.map((preset, i) => (
                <button
                  key={preset}
                  onClick={() => setSize(preset)}
                  className={`py-2 rounded text-xs font-medium transition-colors ${
                    size === preset
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {BOARD_PRESET_LABELS[i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export type PrecomputedEval = {
  score: EvaluationScore | undefined
  bestMove: string | undefined
}

export type BoardPanelProps = {
  title?: ReactNode
  extraShapes?: DrawShape[]
  showThreatsControl?: boolean
  defaultShowThreats?: boolean
  onToggleThreats?: () => void
  precomputedEval?: PrecomputedEval
}

export function BoardPanel({
  title,
  extraShapes = [],
  showThreatsControl = false,
  defaultShowThreats = false,
  onToggleThreats,
  precomputedEval,
}: BoardPanelProps) {
  const { size: boardSize } = useBoardSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showThreats, setShowThreats] = useState(defaultShowThreats)

  const { config, threats, orientation } = useBoardConfig()
  const setOrientation = useChessStore(s => s.setOrientation)

  const flipOrientation = useCallback(() => {
    setOrientation(orientation === 'white' ? 'black' : 'white')
  }, [orientation, setOrientation])

  const fen = config.fen

  // Skip live eval only when we have an actual stored score; fall back to live otherwise
  const hasPrecomputedScore = precomputedEval?.score !== undefined
  const { score: liveScore, isLoading: evalLoading, bestMove: liveBestMove } = usePositionEvaluation(
    hasPrecomputedScore ? undefined : fen,
  )
  const score = hasPrecomputedScore ? precomputedEval!.score : liveScore
  const bestMove = precomputedEval?.bestMove ?? liveBestMove
  const bestMoveShape = useMemo<DrawShape[]>(
    () => bestMove
      ? [{ orig: bestMove.slice(0, 2) as import('@lichess-org/chessground/types').Key, dest: bestMove.slice(2, 4) as import('@lichess-org/chessground/types').Key, brush: 'blue' }]
      : [],
    [bestMove],
  )

  const allShapes = useMemo(
    () => [...extraShapes, ...bestMoveShape],
    [extraShapes, bestMoveShape],
  )

  const assemblyWidth = EVAL_BAR_WIDTH + 8 + boardSize + 8 + GEAR_BUTTON_WIDTH

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {title !== undefined && (
        <div style={{ width: assemblyWidth }} className="flex items-center justify-between gap-2 flex-shrink-0">
          {title}
        </div>
      )}

      <div className="flex flex-row gap-2 flex-shrink-0" style={{ height: boardSize }}>
        <EvaluationBar score={score} isLoading={evalLoading} />

        <div style={{ width: boardSize, height: boardSize, flexShrink: 0, position: 'relative' }}>
          <ChessBoard
            config={config}
            boardWidth={boardSize}
            extraShapes={allShapes}
          />
          {showThreats && (
            <ThreatOverlay threats={threats} boardSize={boardSize} orientation={orientation} />
          )}
        </div>

        <div className="self-start flex-shrink-0 flex flex-col gap-1" style={{ width: GEAR_BUTTON_WIDTH }}>
          <button
            onClick={() => setShowSettings(v => !v)}
            className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Board settings"
          >
            <GearIcon />
          </button>
          <button
            onClick={flipOrientation}
            className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={`Flip board (${orientation === 'white' ? 'White' : 'Black'} on bottom)`}
          >
            <FlipIcon />
          </button>
          {showThreatsControl && (
            <button
              onClick={() => { setShowThreats(v => !v); onToggleThreats?.() }}
              className={`p-1.5 rounded transition-colors ${
                showThreats
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle threat hints"
            >
              <EyeIcon />
            </button>
          )}
        </div>
      </div>

      <BoardSettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
