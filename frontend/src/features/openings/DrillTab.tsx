import { useReducer, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthSession } from './useAuthSession'
import { drillApi } from './api'
import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { OpeningComment } from './OpeningComment'
import type { DrillQueueItem, DrillGrade } from './types'
import type { MoveResult } from '../../components/ChessBoard/ChessBoard'

type DrillState =
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

const GRADE_BUTTONS = [
  { grade: 0 as DrillGrade, label: 'Again', color: 'bg-red-500/20 text-red-300 hover:bg-red-500/30' },
  { grade: 3 as DrillGrade, label: 'Hard', color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' },
  { grade: 4 as DrillGrade, label: 'Good', color: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' },
  { grade: 5 as DrillGrade, label: 'Easy', color: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
] as const

export function DrillTab() {
  const isLoggedIn = !!useAuthSession()
  const qc = useQueryClient()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['drill-queue'],
    queryFn: drillApi.queue,
    enabled: isLoggedIn,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ openingId, grade }: { openingId: number; grade: DrillGrade }) =>
      drillApi.review(openingId, grade),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drill-queue'] }),
  })

  const [state, dispatch] = useReducer(drillReducer, { phase: 'queue' })

  // Clear flash after 600ms, reset board to pre-wrong position
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

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-gray-400">Sign in to use the drill queue</p>
          <a href="/?modal=login" className="text-amber-400 hover:underline text-sm">Sign in →</a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading…</div>
  }

  if (state.phase === 'queue') {
    if (queue.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <p className="text-gray-400 text-lg font-semibold">Queue complete</p>
            <p className="text-gray-600 text-sm">No openings due for review today.</p>
            <p className="text-gray-600 text-sm">
              Add openings from the{' '}
              <a href="/openings/?tab=browse" className="text-amber-400 hover:underline">Browse tab</a>.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white font-semibold">{queue.length} opening{queue.length !== 1 ? 's' : ''} due</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {queue.map(item => (
            <div key={item.opening_id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5">
              <div>
                <span className="text-xs font-mono text-amber-400 mr-2">{item.eco}</span>
                <span className="text-sm text-white">{item.name}</span>
                <span className="ml-2 text-xs text-gray-500">rep #{item.repetitions}</span>
              </div>
              <button
                onClick={() => dispatch({ type: 'start', item })}
                className="px-3 py-1 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded transition-colors"
              >
                Drill
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (state.phase === 'drilling') {
    const { item, moveIndex, fen, flash } = state
    const progress = `${moveIndex} / ${item.moves.length}`
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
          <div className="text-center">
            <div className="text-xs font-mono text-amber-400">{item.eco}</div>
            <div className="text-lg font-semibold text-white">{item.name}</div>
            <div className="text-xs text-gray-500 mt-1">{progress} moves</div>
          </div>

          <div
            className={`w-full max-w-lg transition-all duration-150 ${
              flash === 'wrong' ? 'ring-4 ring-red-500/60 rounded' : ''
            } ${flash === 'correct' ? 'ring-2 ring-green-500/40 rounded' : ''}`}
          >
            <ChessBoard position={fen} interactive={flash !== 'wrong'} onMove={handleMove} />
          </div>

          <button
            onClick={() => dispatch({ type: 'back_to_queue' })}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            ← Back to queue
          </button>
        </div>

        <div className="w-64 flex-shrink-0 border-l border-white/10 p-3 overflow-y-auto">
          <OpeningComment openingId={item.opening_id} />
        </div>
      </div>
    )
  }

  if (state.phase === 'grading') {
    const { item } = state
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-center">
            <div className="text-green-400 text-lg mb-1">✓ Complete</div>
            <div className="text-xs font-mono text-amber-400">{item.eco}</div>
            <div className="text-lg font-semibold text-white">{item.name}</div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-400 text-sm">How well did you recall it?</p>
            <div className="flex gap-2">
              {GRADE_BUTTONS.map(({ grade, label, color }) => (
                <button
                  key={grade}
                  onClick={() => handleGrade(grade)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-64 flex-shrink-0 border-l border-white/10 p-3 overflow-y-auto">
          <OpeningComment openingId={item.opening_id} />
        </div>
      </div>
    )
  }

  return null
}
