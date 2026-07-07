import { ChessBoard, ChessBoardProvider, getMoves, getActiveMove, useChessBoardStore, useChessBoardStoreApi, getCurrentFen, getLastMove } from '../../board'
import { useBoardSettings } from '../../../stores/board/boardSettingsStore'
import { useShallow } from 'zustand/shallow'
import { TrainSetup } from './TrainSetup'
import { TrainHeader } from './TrainHeader'
import { SessionSummary } from './SessionSummary'
import { CorrectBanner, GradeButtons } from './MoveReveal'
import { MovesList } from '../../../components/MovesList/MovesList'
import { useDueCards } from '../../../data/hooks/useTrain'
import { useDrillBoard } from '../hooks/useDrillBoard'
import type { TrainMode } from '../types'

type TrainSessionProps = {
  initialMode?: TrainMode
}

export function TrainSession({ initialMode }: TrainSessionProps) {
  return (
    <ChessBoardProvider>
      <TrainSessionInner initialMode={initialMode} />
    </ChessBoardProvider>
  )
}

function TrainSessionInner({ initialMode }: TrainSessionProps) {
  const store = useChessBoardStoreApi()
  const { data: dueCards = [] } = useDueCards()

  const boardState = useChessBoardStore(
    useShallow((s) => ({
      fen: getCurrentFen(s),
      orientation: s.orientation,
      interactive: s.interactive,
      lastMove: getLastMove(s),
      moves: getMoves(s),
      activeMove: getActiveMove(s),
      history: s.history,
      navigateToIndex: s.navigateToIndex,
      loadMoves: s.loadMoves,
      setOrientation: s.setOrientation,
      setInteractive: s.setInteractive,
      reset: s.reset,
    })),
  )
  const { phase, setPhase, currentCard, isCorrect, mode, setMode } = useDrillBoard(
    dueCards,
    boardState.history,
    boardState.loadMoves,
    boardState.setOrientation,
    boardState.setInteractive,
    boardState.reset,
    initialMode,
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
          arrows={[]}
          circles={[]}
          config={{ showBestMove: false, boardSize }}
          actions={{
            applyMove: store.getState().applyMove,
            navigateBack: store.getState().navigateBack,
            navigateForward: store.getState().navigateForward,
          }}
        />
        {revealed && <CorrectBanner correct={isCorrect ?? false} />}
        <div className={`w-full mt-3${!revealed ? ' invisible' : ''}`}>
          <GradeButtons card={currentCard} onGrade={() => setPhase({ type: 'done' })} />
        </div>
      </section>

      <section className="flex flex-col min-h-0 h-full w-[176px] overflow-hidden border border-white/[0.09] rounded">
        <MovesList moves={boardState.moves} activeMove={boardState.activeMove} onMoveClick={onMoveClick} />
      </section>
    </div>
  )
}
