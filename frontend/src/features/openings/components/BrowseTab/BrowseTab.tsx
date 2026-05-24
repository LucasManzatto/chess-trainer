import { useState, useCallback } from 'react'
import { ChessBoard } from '../../../../components/ChessBoard/ChessBoard'
import { useBoardSettingsStore } from '../../../../stores/useBoardSettingsStore'
import { openingColor } from '../../types'
import type { Opening } from '../../types'
import { NotesPanel } from '../NotesPanel'
import { OpeningsList } from '../OpeningsList/OpeningsList'
import { ContinuationsList } from '../ExploreTab/ContinuationsList'
import { MoveList } from './MoveList'
import { useBrowseTab } from './useBrowseTab'
import { useAddToDrill } from './useAddToDrill'
import type { Key } from '@lichess-org/chessground/types'
import { usePositionEvaluation } from '../../../evaluation/hooks/usePositionEvaluation'
import { EvaluationBar } from '../../../evaluation/components/EvaluationBar'

const EVAL_BAR_WIDTH = 16
const GEAR_BUTTON_WIDTH = 28

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

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.3.07-.62.07-.94s-.03-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.3-.07.63-.07.94s.03.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"/>
    </svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
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
              {([350, 450, 550, 700] as const).map((preset, i) => (
                <button
                  key={preset}
                  onClick={() => setSize(preset)}
                  className={`py-2 rounded text-xs font-medium transition-colors ${
                    size === preset
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {(['S', 'M', 'L', 'XL'] as const)[i]}
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

          <div style={{ width: boardSize, height: boardSize, flexShrink: 0 }}>
            <ChessBoard
              boardWidth={boardSize}
              position={boardFen}
              orientation={orientation}
              onMove={handleMove}
              lastMove={lastMoveSquares}
              extraShapes={[...shapes, ...bestMoveShape]}
            />
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
              </svg>
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
