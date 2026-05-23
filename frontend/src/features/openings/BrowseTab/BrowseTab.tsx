import { ChessBoard } from '../../../components/ChessBoard/ChessBoard'
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
    ecoGroup,
    search,
    moveIndex,
    boardFen,
    currentMoveFen,
    setEcoGroup,
    setSearch,
    setMoveIndex,
    selectOpening,
  } = useBrowseTab()

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/10">
        <OpeningsList
          openings={openings}
          isLoading={isLoading}
          selectedId={selected?.id}
          search={search}
          ecoGroup={ecoGroup}
          onSearchChange={setSearch}
          onEcoChange={setEcoGroup}
          onSelect={selectOpening}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-w-0">
        <div className="w-full max-w-md">
          <ChessBoard position={boardFen} interactive={false} />
        </div>
      </div>

      <div className="w-72 flex-shrink-0 flex flex-col border-l border-white/10 overflow-y-auto">
        {selected ? (
          <>
            <div className="p-3 border-b border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-amber-400">{selected.eco}</div>
              <div className="text-sm font-semibold text-white">{selected.name}</div>
              <AddToDrillButton openingId={selected.id} />
            </div>

            <div className="flex-1 overflow-y-auto">
              <MoveList
                moves={selected.moves}
                moveIndex={moveIndex}
                onMoveClick={setMoveIndex}
              />
            </div>

            <div className="border-t border-white/10 p-3">
              <NotesPanel
                openingId={selected.id}
                moveIndex={moveIndex}
                fen={currentMoveFen}
                moves={selected.moves}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm p-4 text-center">
            Select an opening to view its moves and notes
          </div>
        )}
      </div>
    </div>
  )
}
