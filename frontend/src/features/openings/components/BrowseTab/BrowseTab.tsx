import { useState, useCallback, useMemo } from 'react'
import { ChessBoard } from '../../../../components/ChessBoard/ChessBoard'
import { useBoardSettingsStore } from '../../../../stores/useBoardSettingsStore'
import { GearIcon, FlipIcon, EyeIcon, CloseIcon, HangingPieceIcon, PinnedPieceIcon } from '../../../../components/icons'
import { openingColor } from '../../types'
import type { Opening } from '../../types'
import { NotesPanel } from '../NotesPanel'
import { OpeningsList } from '../OpeningsList/OpeningsList'
import { ContinuationsList } from '../ExploreTab/ContinuationsList'
import { MoveList } from './MoveList'
import { useBrowseTab } from './useBrowseTab'
import { useAddToDrill } from './useAddToDrill'
import { computeThreats } from './threatShapes'
import type { ThreatSquares } from './threatShapes'
import type { Key } from '@lichess-org/chessground/types'
import { usePositionEvaluation } from '../../../evaluation/hooks/usePositionEvaluation'
import { EvaluationBar } from '../../../evaluation/components/EvaluationBar'

const BOARD_PRESETS = [350, 450, 550, 700] as const
const BOARD_PRESET_LABELS = ['S', 'M', 'L', 'XL'] as const

const EVAL_BAR_WIDTH = 16
const GEAR_BUTTON_WIDTH = 28
const DOT_SIZE = 22

function squareToPixel(square: string, boardSize: number, orientation: 'white' | 'black') {
  const fileIdx = square.charCodeAt(0) - 97
  const rankIdx = parseInt(square[1]) - 1
  const sq = boardSize / 8
  const col = orientation === 'white' ? fileIdx : 7 - fileIdx
  const row = orientation === 'white' ? 7 - rankIdx : rankIdx
  return { left: col * sq + sq - DOT_SIZE - 2, top: row * sq + 2 }
}


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


function BoardSettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { size, setSize } = useBoardSettingsStore()

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-72 bg-gray-950 border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-250 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.08] flex-shrink-0">
          <span className="text-sm font-semibold text-white">Board Settings</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
          {/* Size slider */}
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

          {/* Presets */}
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

export function BrowseTab() {
  const {
    openings,
    isLoading,
    selected,
    exactMatch,
    search,
    allMoves,
    currentMoveIndex,
    boardFen,
    currentMoveFen,
    openingMoveIndex,
    candidateMoves,
    shapes,
    lastMoveSquares,
    setSearch,
    setMoveIndex,
    selectOpening,
    handleMove,
    resetBoard,
  } = useBrowseTab()

  const { score, isLoading: evalLoading, bestMove } = usePositionEvaluation(boardFen)
  const bestMoveShape = bestMove
    ? [{ orig: bestMove.slice(0, 2) as Key, dest: bestMove.slice(2, 4) as Key, brush: 'blue' as const }]
    : []

  const { size: boardSize } = useBoardSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const closeSettings = useCallback(() => setShowSettings(false), [])
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const flipOrientation = useCallback(() => setOrientation(o => o === 'white' ? 'black' : 'white'), [])
  const [showThreats, setShowThreats] = useState(false)
  const threats = useMemo(
    () => showThreats && boardFen ? computeThreats(boardFen) : { hanging: [], pinned: [] },
    [showThreats, boardFen],
  )
  const handleSelectOpening = useCallback((o: Opening) => {
    selectOpening(o)
    setOrientation(openingColor(o))
  }, [selectOpening])

  const assemblyWidth = EVAL_BAR_WIDTH + 8 + boardSize + 8 + GEAR_BUTTON_WIDTH

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      {/* Left: openings list */}
      <section className="overflow-y-auto min-h-0 bg-white/[0.03] border border-white/[0.06]">
        <OpeningsList
          openings={openings}
          isLoading={isLoading}
          selectedId={exactMatch?.id ?? selected?.id}
          selectedName={selected?.name}
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelectOpening}
          defaultViewMode="name"
        />
      </section>

      {/* Center: board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden gap-3">
        {/* Title row — aligned to board assembly width */}
        <div style={{ width: assemblyWidth }} className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="text-xl font-semibold text-white leading-snug truncate">
            {selected?.name ?? ''}
          </div>
          {selected && <AddToDrillButton openingId={selected.id} />}
        </div>

        {/* Board assembly */}
        <div className="flex flex-row gap-2 flex-shrink-0" style={{ height: boardSize }}>
          <EvaluationBar score={score} isLoading={evalLoading} />

          <div style={{ width: boardSize, height: boardSize, flexShrink: 0, position: 'relative' }}>
            <ChessBoard
              boardWidth={boardSize}
              position={boardFen}
              orientation={orientation}
              onMove={handleMove}
              lastMove={lastMoveSquares}
              extraShapes={[...shapes, ...bestMoveShape]}
            />
            {showThreats && (
              <ThreatOverlay threats={threats} boardSize={boardSize} orientation={orientation} />
            )}
          </div>

          {/* Controls column — gear + flip, top-right outside board */}
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
            <button
              onClick={() => setShowThreats(v => !v)}
              className={`p-1.5 rounded transition-colors ${
                showThreats
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle threat hints (red = unprotected, yellow = pinned)"
            >
              <EyeIcon />
            </button>
          </div>
        </div>
      </section>

      {/* Moves */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MoveList
            moves={allMoves}
            moveIndex={currentMoveIndex >= 0 ? currentMoveIndex : null}
            onMoveClick={setMoveIndex}
            onReset={resetBoard}
          />
        </div>
        <ContinuationsList candidateMoves={candidateMoves} />
      </section>

      {/* Notes */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="px-3 h-10 flex items-center border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {selected ? (
            <NotesPanel
              openingId={selected.id}
              moveIndex={openingMoveIndex}
              fen={currentMoveFen}
              moves={selected.moves}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm text-center">
              Select an opening to add notes
            </div>
          )}
        </div>
      </section>

      {/* Settings drawer — fixed, full page height */}
      <BoardSettingsDrawer open={showSettings} onClose={closeSettings} />
    </div>
  )
}
