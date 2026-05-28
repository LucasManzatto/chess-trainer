import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { ChessBoard, ChessBoardProvider } from '../../../features/board'
import { ChessBoardHeader } from '../../../features/openings/components/ChessBoardHeader'
import { useNextMoveShapes } from './hooks/useNextMoveShapes'
import { useSyncOpeningToBoard } from './hooks/useSyncOpeningToBoard'
import { useFilteredOpenings } from './hooks/useFilteredOpenings'
import { OpeningsList } from '../../../features/openings/components/OpeningsList'
import { MovesList } from '../../../features/openings/components/MovesList'
import { Notes } from '../../../features/openings/components/Notes'

export const Route = createFileRoute('/openings/browse')({
  component: BrowseV2Page,
})

function BrowseV2Page() {
  return (
    <ChessBoardProvider>
      <OpeningsStoreProvider>
        <BrowseV2PageInner />
      </OpeningsStoreProvider>
    </ChessBoardProvider>
  )
}

function BrowseV2PageInner() {
  useSyncOpeningToBoard()

  const [search, setSearch] = useState('')
  const displayed = useFilteredOpenings(search)

  useNextMoveShapes(displayed)

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-auto min-h-0 bg-white/[0.03] border border-white/[0.06]">
        <OpeningsList openings={displayed} search={search} onSearchChange={setSearch} />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <ChessBoard header={<ChessBoardHeader />} />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <MovesList />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <Notes />
      </section>
    </div>
  )
}
