import { useState } from 'react'
import { getMoves, getActiveMove, getCurrentFen, ChessBoard, ChessBoardProvider, useChessBoardStore } from '../../../features/board'
import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { ChessBoardHeader } from '../../../features/openings/components/ChessBoardHeader'
import { useSyncOpeningToBoard, useFilteredOpenings, useMoveStatsShapes } from './hooks'
import { OpeningsList } from '../../../features/openings/components/OpeningsList'
import { MovesList } from '../../../components/MovesList/MovesList'
import { Notes } from '../../../features/openings/components/Notes'
import { getSelectedOpening, useOpeningsStore } from '../../../features/openings/store/openingsStore'


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

  useMoveStatsShapes()

  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessBoardStore(s => s.navigateToIndex)
  const selectedOpening = useOpeningsStore(getSelectedOpening)

  const moves = useChessBoardStore(getMoves)
  const activeMove = useChessBoardStore(getActiveMove)
  const currentFen = useChessBoardStore(getCurrentFen)

  function onMoveClick(moveNumber: number, color: 'white' | 'black') {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">
      <section className="overflow-y-auto min-h-0 bg-white/[0.055] border border-white/[0.09] rounded">
        <OpeningsList openings={displayed} search={search} onSearchChange={setSearch} />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <ChessBoard header={<ChessBoardHeader />} />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <MovesList moves={moves} activeMove={activeMove} onMoveClick={onMoveClick} />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <Notes selectedOpening={selectedOpening} currentMoveIndex={currentMoveIndex} currentFen={currentFen} />
      </section>
    </div>
  )
}
