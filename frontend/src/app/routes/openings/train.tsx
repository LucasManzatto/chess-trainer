import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ChessBoard, ChessBoardProvider, getMoves, getActiveMove, useChessBoardStore } from '../../../features/board'
import { TrainStoreProvider } from '../../../features/train/store/TrainStoreProvider'
import { TrainSetup } from '../../../features/train/components/TrainSetup'
import { TrainHeader } from '../../../features/train/components/TrainHeader'
import { SessionSummary } from '../../../features/train/components/SessionSummary'
import { CorrectBanner, GradeButtons } from '../../../features/train/components/MoveReveal'
import { MovesList } from '../../../components/MovesList/MovesList'
import { useDrillBoard } from './hooks'

export const Route = createFileRoute('/openings/train')({
  component: TrainPage,
})

function TrainPage() {
  return (
    <ChessBoardProvider>
      <TrainStoreProvider>
        <TrainPageInner />
      </TrainStoreProvider>
    </ChessBoardProvider>
  )
}

function TrainPageInner() {
  const { phase, setPhase, currentCard, isCorrect, mode, setMode } = useDrillBoard()
  const history = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex = useChessBoardStore(s => s.navigateToIndex)
  const moves = useMemo(() => getMoves({ history }), [history])
  const activeMove = getActiveMove({ currentMoveIndex })

  function onMoveClick(moveNumber: number, color: 'white' | 'black') {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }

  const goIdle = () => setPhase({ type: 'idle' })

  if (phase.type === 'idle') {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0 overflow-auto">
        <TrainSetup mode={mode} setMode={setMode} setPhase={setPhase} />
      </div>
    )
  }

  if (phase.type === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    )
  }

  if (phase.type === 'done') {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0 overflow-auto">
        <SessionSummary onTrainAgain={() => setPhase({ type: 'loading' })} onBack={goIdle} />
      </div>
    )
  }

  if (!currentCard) return null

  const revealed = phase.type === 'revealed'

  return (
    <div className="flex items-center justify-center gap-5 p-6 h-full w-full overflow-hidden">
      <section className="relative flex flex-col items-center justify-center min-h-0 h-full rounded flex-1 max-w-2xl">
        <ChessBoard
          showEvalBar={false}
          showSettings={false}
          header={<TrainHeader mode={mode} onBack={goIdle} />}
        />
        {revealed && <CorrectBanner correct={isCorrect ?? false} />}
        <div className={`w-full mt-3${!revealed ? ' invisible' : ''}`}>
          <GradeButtons card={currentCard} onGrade={() => setPhase({ type: 'done' })} />
        </div>
      </section>

      <section className="flex flex-col min-h-0 h-full w-[220px] overflow-hidden border border-white/[0.09] rounded">
        <MovesList moves={moves} activeMove={activeMove} onMoveClick={onMoveClick} />
      </section>
    </div>
  )
}
