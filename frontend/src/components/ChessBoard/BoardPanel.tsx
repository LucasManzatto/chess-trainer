import { type ReactNode, useMemo, useState } from 'react'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Config } from '@lichess-org/chessground/config'
import { EvaluationBar } from '../../features/evaluation/components/EvaluationBar'
import { usePositionEvaluation } from '../../features/evaluation/hooks/usePositionEvaluation'
import { useBoardSettingsStore } from '../../stores/useBoardSettingsStore'
import { CloseIcon, EyeIcon, FlipIcon, GearIcon, HangingPieceIcon, PinnedPieceIcon } from '../icons'
import { ChessBoard } from './ChessBoard'
import { computeThreats } from './threatShapes'

const EVAL_BAR_WIDTH = 16
const GEAR_BUTTON_WIDTH = 28
const DOT_SIZE = 22
const BOARD_PRESETS = [350, 450, 550, 700] as const
const BOARD_PRESET_LABELS = ['S', 'M', 'L', 'XL'] as const

function squareToPixel(square: string, boardSize: number, orientation: 'white' | 'black') {
  const fileIdx = square.charCodeAt(0) - 97
  const rankIdx = parseInt(square[1]) - 1
  const sq = boardSize / 8
  const col = orientation === 'white' ? fileIdx : 7 - fileIdx
  const row = orientation === 'white' ? 7 - rankIdx : rankIdx
  return { left: col * sq + sq - DOT_SIZE - 2, top: row * sq + 2 }
}

type ThreatSquares = { hanging: string[]; pinned: string[] }

function ThreatOverlay({ threats, boardSize, orientation }: {
  threats: ThreatSquares
  boardSize: number
  orientation: 'white' | 'black'
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {threats.hanging.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation)
        return (
          <div key={`h-${sq}`} className="absolute drop-shadow-md" style={{ width: DOT_SIZE, height: DOT_SIZE, left, top }}>
            <HangingPieceIcon />
          </div>
        )
      })}
      {threats.pinned.map(sq => {
        const { left, top } = squareToPixel(sq, boardSize, orientation)
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

export type BoardPanelProps = {
  config: Config
  onFlipOrientation: () => void
  title?: ReactNode
  extraShapes?: DrawShape[]
  showThreatsControl?: boolean
}

export function BoardPanel({
  config,
  onFlipOrientation,
  title,
  extraShapes = [],
  showThreatsControl = false,
}: BoardPanelProps) {
  const { size: boardSize } = useBoardSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showThreats, setShowThreats] = useState(false)

  const fen = config.fen
  const orientation = config.orientation ?? 'white'

  const { score, isLoading: evalLoading, bestMove } = usePositionEvaluation(fen)
  const bestMoveShape = useMemo<DrawShape[]>(
    () => bestMove
      ? [{ orig: bestMove.slice(0, 2) as import('@lichess-org/chessground/types').Key, dest: bestMove.slice(2, 4) as import('@lichess-org/chessground/types').Key, brush: 'blue' }]
      : [],
    [bestMove],
  )

  const threats = useMemo(
    () => showThreats && fen ? computeThreats(fen) : { hanging: [], pinned: [] },
    [showThreats, fen],
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
            onClick={onFlipOrientation}
            className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={`Flip board (${orientation === 'white' ? 'White' : 'Black'} on bottom)`}
          >
            <FlipIcon />
          </button>
          {showThreatsControl && (
            <button
              onClick={() => setShowThreats(v => !v)}
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
