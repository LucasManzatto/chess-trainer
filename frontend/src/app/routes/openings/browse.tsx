import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ChessStoreProvider } from '../../../components/ChessBoard/ChessStoreProvider'
import { MoveList } from '../../../components/MoveList/MoveList'
import { PanelSection } from '../../../components/PanelSection'
import { ContinuationsList } from '../../../components/ContinuationsList'
import { NotesPanel } from '../../../features/openings/components/NotesPanel'
import { OpeningsList } from '../../../features/openings/components/OpeningsList/OpeningsList'
import { BoardPanel } from '../../../components/ChessBoard/BoardPanel'
import { useOpenings } from '../../../features/openings/hooks/useOpenings'
import { useChessGame } from '../../../components/ChessBoard/hooks/useChessGame'
import { useBrowseOpeningContext } from '../../../features/openings/components/BrowseTab/useBrowseOpeningContext'

const searchSchema = z.object({
  openingId: z.number().optional().catch(undefined),
})

export const Route = createFileRoute('/openings/browse')({
  validateSearch: searchSchema,
  component: BrowsePage,
})

function BrowsePage() {
  return <ChessStoreProvider><BrowsePageInner /></ChessStoreProvider>
}

function BrowsePageInner() {
  const { data: openings } = useOpenings()
  const { boardFen, currentMoves, currentMoveIndex, reset } = useChessGame()
  const context = useBrowseOpeningContext(openings, currentMoves)

  const openingMoveIndex: number | null =
    context.selected && currentMoveIndex >= 0 && currentMoveIndex < context.selected.moves.length
      ? currentMoveIndex
      : null

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-auto min-h-0 bg-white/[0.03] border border-white/[0.06]">
        <OpeningsList />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          showThreatsControl={true}
          openingName={context.selected?.name ?? ''}
          openingId={context.selected?.id}
        />
      </section>

      <PanelSection>
        <div className="flex-1 min-h-0 overflow-hidden">
          <MoveList
            showHeader={true}
            onReset={reset}
          />
        </div>
        <ContinuationsList candidateMoves={context.candidateMoves} />
      </PanelSection>

      <PanelSection title="Notes">
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {context.selected ? (
            <NotesPanel
              openingId={context.selected.id}
              moveIndex={openingMoveIndex}
              fen={boardFen}
              moves={context.selected.moves}
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
