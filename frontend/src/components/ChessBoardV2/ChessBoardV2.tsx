import { useEffect, type ReactNode } from 'react'
import { Chess } from 'chess.js'
import { EvaluationBar } from './ChessBoardEvalBar'
import { ChessBoardBoard } from './ChessBoardBoard'
import { ChessBoardSettings } from './ChessBoardSettings'
import { useChessBoardStore, useChessBoardStoreApi } from './store/chessBoardStore'
import { usePositionEvaluation } from './hooks/usePositionEvaluation'
import { getFenAtIndex } from '../../chess/game'

type Props = {
  header?: ReactNode
}

const INITIAL_FEN = new Chess().fen()

function useEvaluation() {
  const store = useChessBoardStoreApi()
  const fen = useChessBoardStore(s =>
    s.lastExternalFen ?? getFenAtIndex(s.history, s.currentMoveIndex) ?? INITIAL_FEN
  )
  const { score, bestMove, isLoading } = usePositionEvaluation(fen)

  useEffect(() => {
    store.getState().setEvaluation(score, bestMove)
  }, [score, bestMove, store])

  return { isLoading }
}

export function ChessBoardV2({ header }: Props) {
  const { isLoading } = useEvaluation()
  const boardSize = useChessBoardStore(s => s.boardSize)
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
