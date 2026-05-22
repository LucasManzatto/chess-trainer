import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { OpeningComment } from './OpeningComment'
import { useDrill, GRADE_BUTTONS } from './useDrill'

export function DrillTab() {
  const { isLoggedIn, queue, isLoading, state, dispatch, handleMove, handleGrade } = useDrill()

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
