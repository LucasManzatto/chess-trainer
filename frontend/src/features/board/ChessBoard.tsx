import { useEffect, type ReactNode } from 'react'
import { EvaluationBar } from './ChessBoardEvalBar'
import { ChessBoardBoard } from './ChessBoardBoard'
import { ChessBoardSettings } from './ChessBoardSettings'
import { useChessBoardStore, useChessBoardStoreApi, getCurrentFen } from './store/chessBoardStore'
import { useBoardSettings } from './store/boardSettingsStore'
import { usePositionEvaluation } from './hooks/usePositionEvaluation'

type Props = {
  header?: ReactNode
}

function useEvaluation() {
  const store = useChessBoardStoreApi()
  const fen = useChessBoardStore(getCurrentFen)
  const { score, bestMove, isLoading } = usePositionEvaluation(fen)

  useEffect(() => {
    store.getState().setEvaluation(score, bestMove)
  }, [score, bestMove, store])

  return { isLoading }
}

export function ChessBoard({ header }: Props) {
  const { isLoading } = useEvaluation()
  const boardSize = useBoardSettings(s => s.boardSize)
  const evalScore = useChessBoardStore(s => s.evalScore)

  return (
    <div className="flex flex-col items-center gap-3">
      {header}
      <div className="flex flex-row gap-2">
        <div style={{ height: boardSize }}>
          <EvaluationBar score={evalScore} isLoading={isLoading} />
        </div>
        <div className="relative">
          <ChessBoardBoard />
          <ChessBoardSettings />
        </div>
      </div>
    </div>
  )
}
