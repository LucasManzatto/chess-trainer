import { ChessBoard } from '../../../../components/ChessBoard/ChessBoard'
import { NotesPanel } from '../NotesPanel'
import { OpeningsList } from '../OpeningsList/OpeningsList'
import { MoveList } from './MoveList'
import { useBrowseTab } from './useBrowseTab'
import { useAddToDrill } from './useAddToDrill'

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
  const {
    openings,
    isLoading,
    selected,
    search,
    moveIndex,
    boardFen,
    currentMoveFen,
    setSearch,
    setMoveIndex,
    selectOpening,
  } = useBrowseTab()

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      {/* Left: openings list */}
      <section className="overflow-y-auto min-h-0 bg-white/[0.03] border border-white/[0.06]">
        <OpeningsList
          openings={openings}
          isLoading={isLoading}
          selectedId={selected?.id}
          search={search}
          onSearchChange={setSearch}
          onSelect={selectOpening}
          defaultViewMode="name"
        />
      </section>

      {/* Center: board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden gap-3">
        {selected && (
          <div className="w-full max-w-[650px] flex items-center justify-between gap-2 flex-shrink-0">
            <div className="text-xl font-semibold text-white leading-snug">{selected.name}</div>
            <AddToDrillButton openingId={selected.id} />
          </div>
        )}
        <div className="w-full max-w-[650px] aspect-square">
          <ChessBoard position={boardFen} interactive={false} />
        </div>
      </section>

      {/* Moves */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        {selected ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MoveList
              moves={selected.moves}
              moveIndex={moveIndex}
              onMoveClick={setMoveIndex}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm text-center p-4">
            Select an opening
          </div>
        )}
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
              moveIndex={moveIndex}
              fen={currentMoveFen}
              moves={selected.moves}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm text-center">
              Select an opening
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
