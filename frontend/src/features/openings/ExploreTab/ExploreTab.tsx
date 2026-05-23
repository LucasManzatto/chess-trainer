import { ChessBoard } from '../../../components/ChessBoard/ChessBoard'
import { NotesPanel } from '../NotesPanel'
import { OpeningsList } from '../OpeningsList/OpeningsList'
import { ContinuationsList } from './ContinuationsList'
import { useExploreTab } from './useExploreTab'

export function ExploreTab() {
  const {
    isLoading,
    moves,
    fen,
    currentNode,
    matchingOpenings,
    exactMatch,
    candidateMoves,
    shapes,
    noOpenings,
    handleMove,
    handleReset,
    handleUndo,
  } = useExploreTab()

  return (
    <div className="flex h-full overflow-hidden">
      {/* Board column */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
        <div className="w-full max-w-lg">
          <ChessBoard
            position={fen}
            interactive={!noOpenings}
            onMove={handleMove}
            extraShapes={shapes}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={moves.length === 0}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
          >
            ← Undo
          </button>
          <button
            onClick={handleReset}
            disabled={moves.length === 0}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
          >
            Reset
          </button>
        </div>

        {moves.length > 0 && (
          <div className="text-xs text-gray-500 font-mono">
            {moves.join(' ')}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col border-l border-white/10 overflow-hidden">
        {isLoading ? (
          <p className="text-gray-500 text-sm p-3">Loading openings…</p>
        ) : noOpenings ? (
          <div className="p-4 text-gray-500 text-sm">No openings from here</div>
        ) : (
          <>
            {exactMatch && (
              <div className="border-b border-white/10">
                <div className="p-3">
                  <div className="text-xs font-mono text-amber-400 mb-0.5">{exactMatch.eco}</div>
                  <div className="text-sm font-semibold text-white">{exactMatch.name}</div>
                </div>
                <div className="px-3 pb-3">
                  <NotesPanel openingId={exactMatch.id} moveIndex={null} fen={undefined} moves={exactMatch.moves} />
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-b border-white/10">
              <span className="text-xs text-gray-500">
                {currentNode ? `${currentNode.count} opening${currentNode.count !== 1 ? 's' : ''}` : '—'}
                {candidateMoves.size > 0 && (
                  <span className="ml-2">· {candidateMoves.size} continuation{candidateMoves.size !== 1 ? 's' : ''}</span>
                )}
              </span>
            </div>

            <ContinuationsList candidateMoves={candidateMoves} />

            <OpeningsList openings={matchingOpenings} selectedId={exactMatch?.id} />
          </>
        )}
      </div>
    </div>
  )
}
