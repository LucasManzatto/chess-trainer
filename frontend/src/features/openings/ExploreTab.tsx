import { useOpeningExplorer } from './useOpeningExplorer'
import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { OpeningComment } from './OpeningComment'

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
  } = useOpeningExplorer()

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
                  <OpeningComment openingId={exactMatch.id} />
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

            {/* Candidate moves list */}
            {candidateMoves.size > 0 && (
              <div className="border-b border-white/10">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Continuations</div>
                <div className="max-h-40 overflow-y-auto">
                  {[...candidateMoves.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([san, count]) => (
                      <div key={san} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-white/5">
                        <span className="font-mono text-gray-200">{san}</span>
                        <span className="text-gray-500 text-xs">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Matching openings list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Openings</div>
              {matchingOpenings.map(o => (
                <div
                  key={o.id}
                  className={`px-3 py-1.5 text-sm border-b border-white/5 ${
                    exactMatch?.id === o.id ? 'text-amber-300 font-semibold' : 'text-gray-400'
                  }`}
                >
                  <span className="text-gray-500 font-mono text-xs mr-2">{o.eco}</span>
                  {o.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
