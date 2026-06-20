import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useCallback } from 'react'
import { Chess } from 'chess.js'

import { ChessBoard, ChessBoardProvider, INITIAL_FEN, getActiveMove, getCurrentFen, getMoves, useChessBoardStore } from '../../../features/board'
import { MovesList } from '../../../components/MovesList/MovesList'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { Notes } from '../../../features/openings/components/Notes'
import { PositionName } from '../../../features/openings/components/PositionName'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { useRepertoireCards } from '../../../features/train/hooks/useRepertoireCards'
import { usePositionMoves } from '../../../features/openings/hooks/usePositionMoves'
import { useSyncOpeningToBoard } from './hooks'
import type { CardCreate, RepertoireCard } from '../../../features/train/types'
import type { PositionMoveCreateBody } from '../../../features/openings/types'
import type { HistoryEntry } from '../../../lib/chess/types'

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/openings/browse')({
  component: BrowseV2Page,
})

// ─── Root (providers only) ────────────────────────────────────────────────────

function BrowseV2Page() {
  return (
    <ChessBoardProvider>
      <OpeningsStoreProvider>
        <BrowseV2PageInner />
      </OpeningsStoreProvider>
    </ChessBoardProvider>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSideFromFen(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

function getSanMoves(history: HistoryEntry[], currentMoveIndex: number): string[] {
  return history.slice(0, currentMoveIndex + 1).map(e => e.san)
}

function getLastMove(
  history: HistoryEntry[],
  currentMoveIndex: number,
  preAnswerFen: string,
): PositionMoveCreateBody | undefined {
  if (currentMoveIndex < 0) return undefined
  const entry = history[currentMoveIndex]
  return { from_fen: preAnswerFen, to_fen: entry.fen, san: entry.san, lan: entry.from + entry.to }
}

function getDrillCard(
  history: HistoryEntry[],
  currentMoveIndex: number,
  sanMoves: string[],
  preAnswerFen: string,
): CardCreate | null {
  if (currentMoveIndex < 0) return null
  return { fen: history[currentMoveIndex].fen, moves: sanMoves, side: getSideFromFen(preAnswerFen) }
}

function getExistingCard(
  drillCard: CardCreate | null,
  allCards: RepertoireCard[],
  preAnswerFen: string,
): RepertoireCard | null {
  return drillCard ? allCards.find(c => c.fen === preAnswerFen) ?? null : null
}

function arrowToPositionMove(orig: string, dest: string, fromFen: string): PositionMoveCreateBody | null {
  const chess = new Chess(fromFen)
  try {
    const move = chess.move({ from: orig, to: dest })
    return { from_fen: fromFen, to_fen: chess.fen(), san: move.san, lan: move.from + move.to }
  } catch {
    return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowseV2PageInner() {
  // Keep board state in sync with the selected opening tree
  useSyncOpeningToBoard()

  // ── Board state ────────────────────────────────────────────────────────────
  const history          = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex  = useChessBoardStore(s => s.navigateToIndex)
  const currentFen       = useChessBoardStore(getCurrentFen)

  // ── Drill / card data ──────────────────────────────────────────────────────
  const { data: allCards = [] } = useRepertoireCards()

  // FEN of the position before the current move — used to match existing cards
  // (card.fen is the drill FEN, i.e. position before the answer move)
  const preAnswerFen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN

  const { sanMoves, lastMove } = useMemo(
    () => ({ sanMoves: getSanMoves(history, currentMoveIndex), lastMove: getLastMove(history, currentMoveIndex, preAnswerFen) }),
    [history, currentMoveIndex, preAnswerFen],
  )
  const drillCard    = useMemo(() => getDrillCard(history, currentMoveIndex, sanMoves, preAnswerFen), [history, currentMoveIndex, sanMoves, preAnswerFen])
  const existingCard = getExistingCard(drillCard, allCards, preAnswerFen)

  // ── Saved continuations from current position ─────────────────────────────
  const { moves: continuations, create: createMove } = usePositionMoves(currentFen)
  const setHintShapes = useChessBoardStore(s => s.setHintShapes)
  const drawnShapes = useChessBoardStore(s => s.drawnShapes)
  const clearDrawnShapes = useChessBoardStore(s => s.clearDrawnShapes)

  const arrowShapes = drawnShapes.filter(s => s.orig && s.dest && s.orig !== s.dest)

  const { mutateAsync: createMoveAsync } = createMove
  const saveArrowsAsMoves = useCallback(async () => {
    const bodies = arrowShapes
      .map(s => arrowToPositionMove(s.orig, s.dest!, currentFen))
      .filter((b): b is PositionMoveCreateBody => b !== null)
    clearDrawnShapes()
    await Promise.allSettled(bodies.map(body => createMoveAsync(body)))
  }, [arrowShapes, currentFen, createMoveAsync, clearDrawnShapes])

  useEffect(() => {
    setHintShapes(continuations.map(m => ({
      orig: m.lan.slice(0, 2) as import('@lichess-org/chessground/types').Key,
      dest: m.lan.slice(2, 4) as import('@lichess-org/chessground/types').Key,
      brush: m.is_main_line ? 'green' : 'blue',
    })))
  }, [continuations, setHintShapes])

  // ── Moves list ─────────────────────────────────────────────────────────────
  const moves      = useMemo(() => getMoves({ history }), [history])
  const activeMove = getActiveMove({ currentMoveIndex })

  function onMoveClick(moveNumber: number, color: 'white' | 'black') {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-[1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">

      {/* Board + opening name + drill button */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <div className="flex flex-col items-stretch">
          <div className="relative flex items-center justify-center px-3 py-2">
            <PositionName fen={currentFen} moves={sanMoves} lastMove={lastMove} />
            <div className="absolute left-0 flex gap-1">
              {arrowShapes.length > 0 && (
                <button
                  onClick={saveArrowsAsMoves}
                  disabled={createMove.isPending}
                  title="Save drawn arrows as moves"
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  Save drawn moves ({arrowShapes.length})
                </button>
              )}
            </div>
            {drillCard && (
              <div className="absolute right-0">
                <AddToDrill
                  card={drillCard}
                  existingCard={existingCard}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                />
              </div>
            )}
          </div>
          <ChessBoard />
        </div>
      </section>

      {/* Move list */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <MovesList moves={moves} activeMove={activeMove} onMoveClick={onMoveClick} />
      </section>

      {/* Notes per position */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <Notes currentFen={currentFen} />
      </section>

    </div>
  )
}
