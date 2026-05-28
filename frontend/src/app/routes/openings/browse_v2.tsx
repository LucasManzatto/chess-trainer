import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings_v2/store/OpeningsStoreProvider'
import { OpeningsListV2 } from '../../../features/openings_v2/components/OpeningsListV2'
import { MovesListV2 } from '../../../features/openings_v2/components/MovesListV2'
import { NotesV2 } from '../../../features/openings_v2/components/NotesV2'
import { ChessBoardV2, ChessBoardV2Provider } from '../../../features/ChessBoardV2'
import { ChessBoardHeader } from '../../../features/openings_v2/components/ChessBoardHeader'
import { useNextMoveShapes } from './hooks/useNextMoveShapes'
import { useSyncOpeningToBoard } from './hooks/useSyncOpeningToBoard'
import { useFilteredOpenings } from './hooks/useFilteredOpenings'

export const Route = createFileRoute('/openings/browse_v2')({
  component: BrowseV2Page,
})

function BrowseV2Page() {
  return (
    <ChessBoardV2Provider>
      <OpeningsStoreProvider>
        <BrowseV2PageInner />
      </OpeningsStoreProvider>
    </ChessBoardV2Provider>
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
        <OpeningsListV2 openings={displayed} search={search} onSearchChange={setSearch} />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <ChessBoardV2 header={<ChessBoardHeader />} />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <MovesListV2 />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded">
        <NotesV2 />
      </section>
    </div>
  )
}
