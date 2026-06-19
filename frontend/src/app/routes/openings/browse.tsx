import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { ChessBoard, ChessBoardProvider, INITIAL_FEN, getActiveMove, getCurrentFen, getMoves, useChessBoardStore } from '../../../features/board'
import { MovesList } from '../../../components/MovesList/MovesList'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { Notes } from '../../../features/openings/components/Notes'
import { PositionName } from '../../../features/openings/components/PositionName'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { useRepertoireCards } from '../../../features/train/hooks/useRepertoireCards'
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
