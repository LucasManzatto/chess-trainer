import { createFileRoute } from '@tanstack/react-router'
import { ChessBoard, ChessBoardProvider, getMoves, getActiveMove, useChessBoardStore, useChessBoardStoreApi, getCurrentFen, getLastMove } from '../../../features/board'
import { useBoardSettings } from '../../../features/board/store/boardSettingsStore'
import { useShallow } from 'zustand/shallow'
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

  const store = useChessBoardStoreApi()
  const boardState = useChessBoardStore(
    useShallow((s) => ({
      fen: getCurrentFen(s),
      orientation: s.orientation,
      interactive: s.interactive,
      evalBestMove: undefined as string | undefined,
      lastMove: getLastMove(s),
      hint: s.hintShapes,
      drawn: s.drawnShapes,
      brushes: s.hintBrushes,
      moves: getMoves(s),
      activeMove: getActiveMove(s),
      navigateToIndex: s.navigateToIndex,
    })),
  )
  const boardSize = useBoardSettings(s => s.boardSize)

  const onMoveClick = (moveNumber: number, color: 'white' | 'black') =>
    boardState.navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))

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
        <TrainHeader mode={mode} onBack={goIdle} />
        <ChessBoard
          state={boardState}
          shapes={{ hint: boardState.hint, drawn: boardState.drawn, brushes: boardState.brushes, annotations: undefined }}
          config={{ showBestMove: false, boardSize }}
          actions={{
            applyMove: store.getState().applyMove,
            navigateBack: store.getState().navigateBack,
            navigateForward: store.getState().navigateForward,
            setDrawnShapes: store.getState().setDrawnShapes,
          }}
        />
        {revealed && <CorrectBanner correct={isCorrect ?? false} />}
        <div className={`w-full mt-3${!revealed ? ' invisible' : ''}`}>
          <GradeButtons card={currentCard} onGrade={() => setPhase({ type: 'done' })} />
        </div>
      </section>

      <section className="flex flex-col min-h-0 h-full w-[220px] overflow-hidden border border-white/[0.09] rounded">
        <MovesList moves={boardState.moves} activeMove={boardState.activeMove} onMoveClick={onMoveClick} />
      </section>
    </div>
  )
}
