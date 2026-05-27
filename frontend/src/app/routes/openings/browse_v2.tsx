import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings_v2/store/OpeningsStoreProvider'
import { OpeningsListV2 } from '../../../features/openings_v2/OpeningsListV2'
import { ChessBoardV2 } from '../../../features/openings_v2/ChessBoardV2'
import { MovesListV2 } from '../../../features/openings_v2/MovesListV2'
import { NotesV2 } from '../../../features/openings_v2/NotesV2'

export const Route = createFileRoute('/openings/browse_v2')({
  component: BrowseV2Page,
})

function BrowseV2Page() {
  return (
    <OpeningsStoreProvider>
      <BrowseV2PageInner />
    </OpeningsStoreProvider>
  )
}

function BrowseV2PageInner() {
  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-auto min-h-0 bg-white/[0.03] border border-white/[0.06]">
        <OpeningsListV2 />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <ChessBoardV2 />
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

