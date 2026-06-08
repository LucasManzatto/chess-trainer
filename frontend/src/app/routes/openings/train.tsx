import { createFileRoute } from '@tanstack/react-router'
import { ChessBoard, ChessBoardProvider } from '../../../features/board'
import { TrainStoreProvider } from '../../../features/train/store/TrainStoreProvider'
import { useTrainStore } from '../../../features/train/store/trainStore'
import { TrainSetup } from '../../../features/train/components/TrainSetup'
import { TrainHeader } from '../../../features/train/components/TrainHeader'
import { CardInfo } from '../../../features/train/components/CardInfo'
import { MoveReveal } from '../../../features/train/components/MoveReveal'
import { SessionSummary } from '../../../features/train/components/SessionSummary'
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
  useDrillBoard()
  const phase = useTrainStore(s => s.phase)

  if (phase.type === 'idle') {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0 overflow-auto">
        <TrainSetup />
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
        <SessionSummary />
      </div>
    )
  }

  // awaiting_move | revealed
  return (
    <div className="grid grid-cols-[300px_1fr_280px] gap-5 p-6 h-full w-full overflow-hidden">
      {/* Col 1 — card info */}
      <section className="flex flex-col min-h-0 overflow-y-auto bg-white/[0.055] border border-white/[0.09] rounded p-4">
        <CardInfo />
      </section>

      {/* Col 2 — chess board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <ChessBoard showEvalBar={false} showSettings={false} header={<TrainHeader />} />
      </section>

      {/* Col 3 — grade panel */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded p-4">
        <MoveReveal />
      </section>
    </div>
  )
}
