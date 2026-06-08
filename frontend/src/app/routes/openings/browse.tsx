import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import { getMoves, getActiveMove, getCurrentFen, ChessBoard, ChessBoardProvider, useChessBoardStore } from '../../../features/board'
import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { useSyncOpeningToBoard, useFilteredOpenings, useMoveStatsShapes, useCurrentOpening } from './hooks'
import { OpeningsList } from '../../../features/openings/components/OpeningsList'
import { MovesList } from '../../../components/MovesList/MovesList'
import { Notes } from '../../../features/openings/components/Notes'
import { getSelectedOpening, useOpeningsStore } from '../../../features/openings/store/openingsStore'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import type { CardCreate } from '../../../features/train/types'

const INITIAL_FEN = new Chess().fen()


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
  const currentOpening = useCurrentOpening()

  const history = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessBoardStore(s => s.navigateToIndex)
  const selectedOpening = useOpeningsStore(getSelectedOpening)

  const moves = useMemo(() => getMoves({ history }), [history])
  const activeMove = getActiveMove({ currentMoveIndex })
  const currentFen = useChessBoardStore(getCurrentFen)

  const drillCard = useMemo((): CardCreate | null => {
    if (currentMoveIndex < 0) return null
    const entry = history[currentMoveIndex]
    const fen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN
    const side = fen.split(' ')[1] === 'w' ? 'white' : 'black'
    return {
      position_key: fen.split(' ').slice(0, 4).join(' '),
      fen,
      side,
      answer: entry.from + entry.to,
      line: history.slice(0, currentMoveIndex).map(e => e.san),
      opening_eco: selectedOpening?.eco ?? null,
      opening_name: selectedOpening?.name ?? null,
    }
  }, [currentMoveIndex, history, selectedOpening])

  function onMoveClick(moveNumber: number, color: 'white' | 'black') {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }

  return (
    <div className="grid grid-cols-[300px_1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">
      <section className="overflow-y-auto min-h-0 bg-white/[0.055] border border-white/[0.09] rounded">
        <OpeningsList openings={displayed} search={search} onSearchChange={setSearch} />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <ChessBoard
          header={
            <div className="relative flex items-center justify-center w-full px-1">
              <span className="text-white/60 text-lg font-medium tracking-wide">
                {currentOpening?.name ?? ''}
              </span>
              {drillCard && (
                <div className="absolute right-0">
                  <AddToDrill
                    card={drillCard}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                  />
                </div>
              )}
            </div>
          }
        />
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
