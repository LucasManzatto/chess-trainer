import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { ChessBoard, ChessBoardProvider, INITIAL_FEN, getActiveMove, getCurrentFen, getMoves, useChessBoardStore } from '../../../features/board'
import { MovesList } from '../../../components/MovesList/MovesList'
import { usePosition } from '../../../features/openings/hooks/usePosition'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { getSelectedPosition, useOpeningsStore } from '../../../features/openings/store/openingsStore'
import { Notes } from '../../../features/openings/components/Notes'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { useRepertoireCards } from '../../../features/train/hooks/useRepertoireCards'
import { useSyncOpeningToBoard } from './hooks'
import type { CardCreate } from '../../../features/train/types'

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

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowseV2PageInner() {
  // Keep board state in sync with the selected opening tree
  useSyncOpeningToBoard()

  // ── Board state ────────────────────────────────────────────────────────────
  const history         = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessBoardStore(s => s.navigateToIndex)
  const currentFen      = useChessBoardStore(getCurrentFen)

  // ── Opening / position data ────────────────────────────────────────────────
  const selectedOpening             = useOpeningsStore(getSelectedPosition)
  const { position: currentPosition } = usePosition(selectedOpening ? currentFen : '')

  // ── Drill / card data ──────────────────────────────────────────────────────
  const { data: allCards = [] } = useRepertoireCards()

  // FEN of the position before the current move — used to match existing cards
  // (card.fen is the drill FEN, i.e. position before the answer move)
  const preAnswerFen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN

  // CardCreate payload for the currently selected move
  const drillCard = useMemo((): CardCreate | null => {
    if (currentMoveIndex < 0) return null
    return {
      fen: history[currentMoveIndex].fen,
      moves: history.slice(0, currentMoveIndex + 1).map(e => e.san),
      side: getSideFromFen(preAnswerFen),
      name: currentPosition?.name ?? selectedOpening?.name ?? null,
    }
  }, [currentMoveIndex, history, preAnswerFen, selectedOpening, currentPosition])

  const existingCard = drillCard
    ? allCards.find(c => c.fen === preAnswerFen) ?? null
    : null

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
            <span className="text-white/60 text-lg font-medium tracking-wide">
              {currentPosition?.name ?? ' '}
            </span>
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
        <Notes selectedOpening={selectedOpening} currentMoveIndex={currentMoveIndex} currentFen={currentFen} />
      </section>

    </div>
  )
}
