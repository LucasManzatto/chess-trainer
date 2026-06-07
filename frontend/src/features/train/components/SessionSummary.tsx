import { useTrainStore, useTrainStoreApi, getNextCard } from '../store/trainStore'

export function SessionSummary() {
  const stats = useTrainStore(s => s.stats)
  const resetSession = useTrainStore(s => s.resetSession)
  const storeApi = useTrainStoreApi()

  function handleTrainAgain() {
    resetSession()
    // TODO: immediately advance to first card once TrainStoreProvider re-syncs fresh due cards
    const next = getNextCard(storeApi.getState())
    if (next) storeApi.getState().setPhase({ type: 'awaiting_move', card: next, quizLineLength: next.line.length })
  }

  function handleBackToSetup() {
    resetSession()
  }

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10 w-full max-w-sm mx-auto select-none">
      {/* Accuracy */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-amber-300 font-semibold leading-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '56px' }}
        >
          {accuracy}%
        </span>
        <span className="text-white/40 text-sm">
          {stats.correct} correct out of {stats.total}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-white/[0.08]" />

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={handleTrainAgain}
          className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold text-sm transition-colors"
        >
          Train Again
        </button>
        <button
          onClick={handleBackToSetup}
          className="w-full py-2.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 text-sm font-medium transition-colors"
        >
          Back to Setup
        </button>
      </div>
    </div>
  )
}
