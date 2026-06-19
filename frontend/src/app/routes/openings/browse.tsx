import { useMemo } from 'react'
import { getMoves, getActiveMove, getCurrentFen, INITIAL_FEN, ChessBoard, ChessBoardProvider, useChessBoardStore } from '../../../features/board'
import { createFileRoute } from '@tanstack/react-router'
import { OpeningsStoreProvider } from '../../../features/openings/store/OpeningsStoreProvider'
import { useSyncOpeningToBoard, useCurrentOpening } from './hooks'
import { MovesList } from '../../../components/MovesList/MovesList'
import { Notes } from '../../../features/openings/components/Notes'
import { getSelectedPosition, useOpeningsStore } from '../../../features/openings/store/openingsStore'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { useRepertoireCards } from '../../../features/train/hooks/useRepertoireCards'
import type { CardCreate } from '../../../features/train/types'


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

function getSideFromFen(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

function BrowseV2PageInner() {
  useSyncOpeningToBoard()
  const currentOpening = useCurrentOpening()

  const history = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessBoardStore(s => s.navigateToIndex)
  const selectedOpening = useOpeningsStore(getSelectedPosition)

  const { data: allCards = [] } = useRepertoireCards()

  const moves = useMemo(() => getMoves({ history }), [history])
  const activeMove = getActiveMove({ currentMoveIndex })
  const currentFen = useChessBoardStore(getCurrentFen)

  const preAnswerFen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN

  const drillCard = useMemo((): CardCreate | null => {
    if (currentMoveIndex < 0) return null
    const positionFen = history[currentMoveIndex].fen
    const cardMoves = history.slice(0, currentMoveIndex + 1).map(e => e.san)
    const side = getSideFromFen(preAnswerFen)
    return {
      fen: positionFen,
      moves: cardMoves,
      side,
      name: selectedOpening?.name ?? null,
    }
  }, [currentMoveIndex, history, preAnswerFen, selectedOpening])

  const existingCard = drillCard
    ? allCards.find(c => c.fen === preAnswerFen) ?? null
    : null

  function onMoveClick(moveNumber: number, color: 'white' | 'black') {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }

  return (
    <div className="grid grid-cols-[1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <div className="flex flex-col items-stretch">
          <div className="relative flex items-center justify-center px-3 py-2">
            <span className="text-white/60 text-lg font-medium tracking-wide">
              {currentOpening?.name ?? ' '}
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

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <MovesList moves={moves} activeMove={activeMove} onMoveClick={onMoveClick} />
      </section>

      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <Notes selectedOpening={selectedOpening} currentMoveIndex={currentMoveIndex} currentFen={currentFen} />
      </section>
    </div>
  )
}
