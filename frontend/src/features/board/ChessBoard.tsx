import { useEffect, type ReactNode } from 'react'
import { EvaluationBar } from './ChessBoardEvalBar'
import { ChessBoardBoard } from './ChessBoardBoard'
import { ChessBoardSettings } from './ChessBoardSettings'
import { useChessBoardStore, useChessBoardStoreApi } from './store/chessBoardStore'
import { getCurrentFen } from './store/slices/gameSlice'
import { useBoardSettings } from './store/boardSettingsStore'
import { usePositionEvaluation } from './hooks/usePositionEvaluation'

type Props = {
  overlay?: ReactNode
  showEvalBar?: boolean
  showSettings?: boolean
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

export function ChessBoard({ overlay, showEvalBar = true, showSettings = true }: Props) {
  const { isLoading } = useEvaluation()
  const boardSize = useBoardSettings(s => s.boardSize)
  const evalScore = useChessBoardStore(s => s.evalScore)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-row gap-2">
        {showEvalBar && (
          <div style={{ height: boardSize }}>
            <EvaluationBar score={evalScore} isLoading={isLoading} />
          </div>
        )}
        <div className="relative">
          <ChessBoardBoard overlay={overlay} />
          {showSettings && <ChessBoardSettings />}
        </div>
      </div>
    </div>
  )
}
