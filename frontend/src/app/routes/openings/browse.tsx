import { createFileRoute } from '@tanstack/react-router'

import { ChessBoard, ChessBoardProvider } from '../../../features/board'
import { MovesList } from '../../../components/MovesList/MovesList'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { Notes } from '../../../features/openings/components/Notes'
import { PositionName } from '../../../features/openings/components/PositionName'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import {
  useSyncOpeningToBoard,
  useBrowseBoard,
  useBrowseDrillCard,
  useBrowseContinuations,
  useBrowseMovesList,
  useContinuationShapes,
} from './hooks'

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

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowseV2PageInner() {
  useSyncOpeningToBoard()
  const { createMove }                     = useContinuationShapes()
  const { currentFen, sanMoves, lastMove } = useBrowseBoard()
  const { drillCard, existingCard }        = useBrowseDrillCard()
  const { arrowShapes, saveArrowsAsMoves, isPending } = useBrowseContinuations({
    createMoveAsync: createMove.mutateAsync,
    isPending: createMove.isPending,
  })
  const { moves, activeMove, onMoveClick } = useBrowseMovesList()

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
                  disabled={isPending}
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
