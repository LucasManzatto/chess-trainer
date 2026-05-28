import { type ReactNode, useCallback, useEffect, useState } from 'react'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { EvaluationBar } from './EvaluationBar'
import { usePositionEvaluation } from './hooks/usePositionEvaluation'
import { useChessDerivedState } from './hooks/useChessDerivedState'
import { useBoardSettingsStore } from './stores/boardSettingsStore'
import { CloseIcon, EyeIcon, FlipIcon, GearIcon } from '../icons'
import { ChessBoard } from './ChessBoard'
import type { EvaluationScore } from './types'
import { useAddToDrill } from '../../features/openings/components/BrowseTab/useAddToDrill'

const EVAL_BAR_WIDTH = 16
const GEAR_BUTTON_WIDTH = 28

// ─── AddToDrillButton ─────────────────────────────────────────────────────────

function AddToDrillButton({ openingId }: { openingId: number }) {
  const { isLoggedIn, inDrill, add, isPending } = useAddToDrill(openingId)
  if (!isLoggedIn) return null
  return (
    <button
      onClick={add}
      disabled={inDrill || isPending}
      className={`text-xs px-3 py-1.5 rounded transition-colors ${
        inDrill
          ? 'bg-green-500/10 text-green-500 cursor-default'
          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
      }`}
    >
      {inDrill ? '✓ In Drill' : '+ Add to Drill'}
    </button>
  )
}

// ─── BoardPanelTitle ──────────────────────────────────────────────────────────

function BoardPanelTitle({ title, width }: { title: ReactNode; width: number }) {
  return (
    <div style={{ width }} className="flex items-center justify-between gap-2 flex-shrink-0">
      {title}
    </div>
  )
}

// ─── BoardSettings ────────────────────────────────────────────────────────────

const BOARD_PRESETS = [350, 450, 550, 700] as const
const BOARD_PRESET_LABELS = ['S', 'M', 'L', 'XL'] as const

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

type BoardSettingsProps = {
  orientation: 'white' | 'black'
  onFlip: () => void
  showThreatsControl: boolean
  showThreats: boolean
  onToggleThreats: () => void
}

function BoardSettings({ orientation, onFlip, showThreatsControl, showThreats, onToggleThreats }: BoardSettingsProps) {
  const [showDrawer, setShowDrawer] = useState(false)

  return (
    <>
      <div className="self-start flex-shrink-0 flex flex-col gap-1" style={{ width: GEAR_BUTTON_WIDTH }}>
        <button
          onClick={() => setShowDrawer(v => !v)}
          className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Board settings"
        >
          <GearIcon />
        </button>
        <button
          onClick={onFlip}
          className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title={`Flip board (${orientation === 'white' ? 'White' : 'Black'} on bottom)`}
        >
          <FlipIcon />
        </button>
        {showThreatsControl && (
          <button
            onClick={onToggleThreats}
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
      <BoardSettingsDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  )
}

// ─── BoardPanel ───────────────────────────────────────────────────────────────

export type PrecomputedEval = {
  score: EvaluationScore | undefined
  bestMove: string | undefined
}

export type BoardPanelProps = {
  title?: ReactNode
  openingName?: string
  openingId?: number
  extraShapes?: DrawShape[]
  showThreatsControl?: boolean
  defaultShowThreats?: boolean
  onToggleThreats?: () => void
  precomputedEval?: PrecomputedEval
  orientation?: 'white' | 'black'
  interactive?: boolean
}

export function BoardPanel({
  title,
  openingName,
  openingId,
  extraShapes = [],
  showThreatsControl = false,
  defaultShowThreats = false,
  onToggleThreats,
  precomputedEval,
  orientation: orientationProp = 'white',
  interactive = true,
}: BoardPanelProps) {
  const { size: boardSize } = useBoardSettingsStore()
  const [showThreats, setShowThreats] = useState(defaultShowThreats)

  const [orientation, setOrientation] = useState(orientationProp)

  useEffect(() => {
    queueMicrotask(() => setOrientation(orientationProp))
  }, [orientationProp])

  const { chess } = useChessDerivedState()
  const fen = chess.fen()

  const flipOrientation = useCallback(() => {
    setOrientation(orientation === 'white' ? 'black' : 'white')
  }, [orientation, setOrientation])

  const handleToggleThreats = useCallback(() => {
    setShowThreats(v => !v)
    onToggleThreats?.()
  }, [onToggleThreats])

  // Skip live eval only when we have an actual stored score; fall back to live otherwise
  const hasPrecomputedScore = precomputedEval?.score !== undefined
  const { score: liveScore, isLoading: evalLoading, bestMove: liveBestMove } = usePositionEvaluation(
    hasPrecomputedScore ? undefined : fen,
  )
  const score = hasPrecomputedScore ? precomputedEval!.score : liveScore
  const bestMove = precomputedEval?.bestMove ?? liveBestMove
  const assemblyWidth = EVAL_BAR_WIDTH + 8 + boardSize + 8 + GEAR_BUTTON_WIDTH

  const resolvedTitle = title ?? (openingName !== undefined ? (
    <>
      <div className="text-xl font-semibold text-white leading-snug truncate">
        {openingName}
      </div>
      {openingId !== undefined && <AddToDrillButton openingId={openingId} />}
    </>
  ) : undefined)

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {resolvedTitle !== undefined && (
        <BoardPanelTitle title={resolvedTitle} width={assemblyWidth} />
      )}

      <div className="flex flex-row gap-2 flex-shrink-0" style={{ height: boardSize }}>
        <EvaluationBar score={score} isLoading={evalLoading} />

        <ChessBoard
          boardWidth={boardSize}
          showThreats={showThreats}
          orientation={orientation}
          interactive={interactive}
          extraShapes={extraShapes}
          bestMove={bestMove}
        />

        <BoardSettings
          orientation={orientation}
          onFlip={flipOrientation}
          showThreatsControl={showThreatsControl}
          showThreats={showThreats}
          onToggleThreats={handleToggleThreats}
        />
      </div>
    </div>
  )
}
