import { useReducer, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthSession } from '../../../../hooks/useAuthSession'
import { drillApi } from '../../api'
import { openingsKeys } from '../../api/queryKeys'
import type { DrillQueueItem, DrillGrade } from '../../types'
import type { MoveResult } from '../../../../components/ChessBoard/ChessBoard'

export type DrillState =
  | { phase: 'queue' }
  | { phase: 'drilling'; item: DrillQueueItem; moveIndex: number; fen: string; flash: 'correct' | 'wrong' | null }
  | { phase: 'grading'; item: DrillQueueItem }

type DrillAction =
  | { type: 'start'; item: DrillQueueItem }
  | { type: 'correct_move'; fen: string; nextIndex: number }
  | { type: 'complete'; item: DrillQueueItem }
  | { type: 'wrong_move' }
  | { type: 'reset_flash'; fen: string; moveIndex: number; item: DrillQueueItem }
  | { type: 'back_to_queue' }

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'start':
      return { phase: 'drilling', item: action.item, moveIndex: 0, fen: INITIAL_FEN, flash: null }
    case 'correct_move':
      if (state.phase !== 'drilling') return state
      return { ...state, moveIndex: action.nextIndex, fen: action.fen, flash: 'correct' }
    case 'complete':
      return { phase: 'grading', item: action.item }
    case 'wrong_move':
      if (state.phase !== 'drilling') return state
      return { ...state, flash: 'wrong' }
    case 'reset_flash':
      if (state.phase !== 'drilling') return state
      return { ...state, fen: action.fen, moveIndex: action.moveIndex, flash: null }
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

export function useDrillTab() {
  const isLoggedIn = !!useAuthSession()
  const qc = useQueryClient()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: openingsKeys.drillQueue(),
    queryFn: ({ signal }) => drillApi.queue(signal),
    enabled: isLoggedIn,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ openingId, grade }: { openingId: number; grade: DrillGrade }) =>
      drillApi.review(openingId, grade),
    onSuccess: () => qc.invalidateQueries({ queryKey: openingsKeys.drillQueue() }),
  })

  const [state, dispatch] = useReducer(drillReducer, { phase: 'queue' })

  useEffect(() => {
    if (state.phase !== 'drilling' || state.flash !== 'wrong') return
    const { fen, moveIndex, item } = state
    const id = setTimeout(() => {
      dispatch({ type: 'reset_flash', fen, moveIndex, item })
    }, 600)
    return () => clearTimeout(id)
  }, [state])

  const handleMove = useCallback((move: MoveResult) => {
    if (state.phase !== 'drilling') return
    const { item, moveIndex } = state
    const expected = item.moves[moveIndex]
    if (move.san === expected) {
      const nextIndex = moveIndex + 1
      if (nextIndex >= item.moves.length) {
        dispatch({ type: 'complete', item })
      } else {
        dispatch({ type: 'correct_move', fen: move.fen, nextIndex })
      }
    } else {
      dispatch({ type: 'wrong_move' })
    }
  }, [state])

  function handleGrade(grade: DrillGrade) {
    if (state.phase !== 'grading') return
    reviewMutation.mutate({ openingId: state.item.opening_id, grade })
    dispatch({ type: 'back_to_queue' })
  }

  return { isLoggedIn, queue, isLoading, state, dispatch, handleMove, handleGrade }
}
