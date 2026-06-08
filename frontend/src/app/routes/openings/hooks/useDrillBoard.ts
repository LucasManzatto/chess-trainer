import { useEffect } from 'react'
import { useChessBoardStore, useChessBoardStoreApi } from '../../../../features/board'
import { useTrainStore } from '../../../../features/train/store/trainStore'

export function useDrillBoard() {
  const phase = useTrainStore(s => s.phase)
  const setPhase = useTrainStore(s => s.setPhase)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const boardStore = useChessBoardStoreApi()

  useEffect(() => {
    if (phase.type !== 'awaiting_move') return
    const board = boardStore.getState()
    board.loadMoves(phase.card.line)
    board.setOrientation(phase.card.side)
    board.setInteractive(true)
    board.setHintShapes([])
  }, [phase, boardStore])

  useEffect(() => {
    if (phase.type !== 'awaiting_move') return
    if (currentMoveIndex !== phase.quizLineLength) return

    const entry = boardStore.getState().history[currentMoveIndex]
    if (!entry) return

    const correct = entry.from + entry.to === phase.card.answer.slice(0, 4)
    setPhase({ type: 'revealed', card: phase.card, correct })
    boardStore.getState().setInteractive(false)
  }, [currentMoveIndex, phase, boardStore, setPhase])
}
