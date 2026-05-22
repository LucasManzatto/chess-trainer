import { useState, useMemo, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import { useOpenings } from './useOpenings'
import { useOpeningTrie, walkTrie, collectOpenings } from './useOpeningTrie'
import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { OpeningComment } from './OpeningComment'
import type { Opening } from './types'
import type { MoveResult } from '../../components/ChessBoard/ChessBoard'

export function ExploreTab() {
  const { data: openings, isLoading } = useOpenings()
  const trie = useOpeningTrie(openings)

  const [moves, setMoves] = useState<string[]>([])
  const [fen, setFen] = useState<string | undefined>(undefined)

  const currentNode = useMemo(() => {
    if (!trie) return null
    return walkTrie(trie, moves)
  }, [trie, moves])

  const matchingOpenings = useMemo((): Opening[] => {
    if (!currentNode) return []
    return collectOpenings(currentNode)
  }, [currentNode])

  const exactMatch: Opening | null = currentNode?.openings[0] ?? null

  // Candidate moves with counts for ChessBoard shapes overlay
  const candidateMoves = useMemo((): Map<string, number> => {
    if (!currentNode) return new Map()
    const result = new Map<string, number>()
    for (const [san, child] of currentNode.children.entries()) {
      result.set(san, child.count)
    }
    return result
  }, [currentNode])

  // Convert SAN candidates to dest squares for highlighting
  const highlightedSquares = useMemo((): Array<{ orig: Key; dest: Key; count: number }> => {
    const chess = fen ? new Chess(fen) : new Chess()
    const result: Array<{ orig: Key; dest: Key; count: number }> = []
    for (const [san, count] of candidateMoves.entries()) {
      const legal = chess.moves({ verbose: true }).find(m => m.san === san)
      if (legal) {
        result.push({ orig: legal.from as Key, dest: legal.to as Key, count })
      }
    }
    return result
  }, [candidateMoves, fen])

  const handleMove = useCallback((move: MoveResult) => {
    setFen(move.fen)
    setMoves(prev => [...prev, move.san])
  }, [])

  function handleReset() {
    setMoves([])
    setFen(undefined)
  }

  function handleUndo() {
    if (moves.length === 0) return
    const newMoves = moves.slice(0, -1)
    setMoves(newMoves)
    if (newMoves.length === 0) {
      setFen(undefined)
    } else {
      const chess = new Chess()
      for (const m of newMoves) chess.move(m)
      setFen(chess.fen())
    }
  }

  const shapes = highlightedSquares.map(({ dest }) => ({ orig: dest, dest, brush: 'green' }))

  const noOpenings = moves.length > 0 && currentNode === null

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
