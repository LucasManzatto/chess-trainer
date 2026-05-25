import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { PanelSection } from '../../../../components/PanelSection'
import { NotesPanel } from '../NotesPanel'
import { OpeningsList } from '../OpeningsList/OpeningsList'
import { ContinuationsList } from '../../../../components/ContinuationsList'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { useBrowseTab } from './useBrowseTab'
import { useAddToDrill } from './useAddToDrill'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'

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

export function BrowseTab() {
  return <ChessStoreProvider><BrowseTabInner /></ChessStoreProvider>
}

function BrowseTabInner() {
  const {
    openings,
    isLoading,
    selected,
    exactMatch,
    search,
    allMoves,
    currentMoveIndex,
    config,
    boardFen,
    openingMoveIndex,
    shapes,
    candidateMoves,
    setSearch,
    setMoveIndex,
    selectOpening,
    flipOrientation,
    resetBoard,
  } = useBrowseTab()

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
          onSelect={selectOpening}
          defaultViewMode="name"
        />
      </section>

      {/* Center: board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          config={config}
          onFlipOrientation={flipOrientation}
          extraShapes={shapes}
          showThreatsControl={true}
          title={
            <>
              <div className="text-xl font-semibold text-white leading-snug truncate">
                {selected?.name ?? ''}
              </div>
              {selected && <AddToDrillButton openingId={selected.id} />}
            </>
          }
        />
      </section>

      {/* Moves */}
      <PanelSection>
        <div className="flex-1 min-h-0 overflow-hidden">
          <MoveList
            moves={allMoves}
            selectedIndex={currentMoveIndex >= 0 ? currentMoveIndex : null}
            onMoveClick={setMoveIndex}
            onReset={resetBoard}
          />
        </div>
        <ContinuationsList candidateMoves={candidateMoves} />
      </PanelSection>

      {/* Notes */}
      <PanelSection title="Notes">
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {selected ? (
            <NotesPanel
              openingId={selected.id}
              moveIndex={openingMoveIndex}
              fen={boardFen}
              moves={selected.moves}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm text-center">
              Select an opening to add notes
            </div>
          )}
        </div>
      </PanelSection>
    </div>
  )
}
