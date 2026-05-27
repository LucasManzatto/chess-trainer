import { useReducer, useEffect, useCallback } from 'react'
import { useDrillQueue } from '../../hooks/useDrillQueue'
import type { DrillQueueItem, DrillGrade } from '../../types'
import type { MoveResult } from '../../../../components/ChessBoard/ChessBoard'
import { useChessGame } from '../../../../components/ChessBoard/hooks/useChessGame'

export type DrillState =
  | { phase: 'queue' }
  | { phase: 'drilling'; item: DrillQueueItem; moveIndex: number; flash: 'correct' | 'wrong' | null }
  | { phase: 'grading'; item: DrillQueueItem }

export type DrillAction =
  | { type: 'start'; item: DrillQueueItem }
  | { type: 'correct_move'; nextIndex: number }
  | { type: 'complete'; item: DrillQueueItem }
  | { type: 'wrong_move' }
  | { type: 'reset_flash'; moveIndex: number }
  | { type: 'back_to_queue' }

export function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'start':
      return { phase: 'drilling', item: action.item, moveIndex: 0, flash: null }
    case 'correct_move':
      if (state.phase !== 'drilling') return state
      return { ...state, moveIndex: action.nextIndex, flash: 'correct' }
    case 'complete':
      return { phase: 'grading', item: action.item }
    case 'wrong_move':
      if (state.phase !== 'drilling') return state
      return { ...state, flash: 'wrong' }
    case 'reset_flash':
      if (state.phase !== 'drilling') return state
      return { ...state, moveIndex: action.moveIndex, flash: null }
    case 'back_to_queue':
      return { phase: 'queue' }
    default:
      return state
  }
}

export const GRADE_BUTTONS = [
  { grade: 0 as DrillGrade, label: 'Again', color: 'bg-red-500/20 text-red-300 hover:bg-red-500/30' },
  { grade: 3 as DrillGrade, label: 'Hard', color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' },
  { grade: 4 as DrillGrade, label: 'Good', color: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' },
  { grade: 5 as DrillGrade, label: 'Easy', color: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
] as const

export function useDrillPage() {
  const { isLoggedIn, queue, isLoading, submitGrade } = useDrillQueue()
  const [state, dispatch] = useReducer(drillReducer, { phase: 'queue' })

  const isDrilling = state.phase === 'drilling'
  const flash = isDrilling ? state.flash : null

  const handleMoveValidate = useCallback((move: MoveResult) => {
    if (state.phase !== 'drilling') return
    const { item, moveIndex } = state
    const expected = item.moves[moveIndex]
    if (move.san === expected) {
      const nextIndex = moveIndex + 1
      if (nextIndex >= item.moves.length) {
        dispatch({ type: 'complete', item })
      } else {
        dispatch({ type: 'correct_move', nextIndex })
      }
    } else {
      dispatch({ type: 'wrong_move' })
    }
  }, [state])

  const board = useChessGame({
    interactive: isDrilling && flash !== 'wrong',
    onMove: handleMoveValidate,
  })

  const drillItem = isDrilling ? state.item : null
  useEffect(() => {
    if (drillItem) board.reset()
  }, [drillItem, board.reset])

  useEffect(() => {
    if (state.phase !== 'drilling' || state.flash !== 'wrong') return
    const { moveIndex } = state
    const id = setTimeout(() => {
      board.undo()
      dispatch({ type: 'reset_flash', moveIndex })
    }, 600)
    return () => clearTimeout(id)
  }, [state, board.undo])

  function handleGrade(grade: DrillGrade) {
    if (state.phase !== 'grading') return
    submitGrade({ openingId: state.item.opening_id, grade })
    dispatch({ type: 'back_to_queue' })
  }

  return {
    isLoggedIn,
    queue,
    isLoading,
    state,
    dispatch,
    config: board.config,
    flash,
    handleGrade,
  }
}
