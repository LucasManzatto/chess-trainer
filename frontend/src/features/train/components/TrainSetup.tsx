import { useTrainStore, useTrainStoreApi, getNextCard } from '../store/trainStore'
import { useCoverage } from '../hooks/useCoverage'

export function TrainSetup() {
  const mode = useTrainStore(s => s.mode)
  const setMode = useTrainStore(s => s.setMode)
  const dueCards = useTrainStore(s => s.dueCards)
  const storeApi = useTrainStoreApi()
  const { data: coverage } = useCoverage()

  const nothingDue = !!coverage && coverage.total > 0 && dueCards.length === 0

  function handleStart() {
    const s = storeApi.getState()
    const next = getNextCard(s)
    if (!next) return
    s.setPhase({ type: 'awaiting_move', card: next, quizLineLength: next.line.length })
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-10 w-full max-w-sm mx-auto select-none">
      <h1
        className="text-white/90 text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Train
      </h1>

      {/* Mode tabs */}
      <div className="flex w-full rounded-lg border border-white/[0.08] overflow-hidden">
        <button
          onClick={() => setMode('drill')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'drill'
              ? 'bg-amber-400/15 text-amber-300'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Drill
        </button>
        <button
          onClick={() => setMode('spar')}
          className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-white/[0.08] ${
            mode === 'spar'
              ? 'bg-amber-400/15 text-amber-300'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Spar
        </button>
      </div>

      {/* Coverage stats */}
      <div className="flex w-full gap-3">
        <div className="flex-1 flex flex-col items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] py-3">
          <span className="text-white/40 text-xs uppercase tracking-wider">White</span>
          <span className="text-white/90 text-xl font-semibold">{coverage?.white ?? '—'}</span>
          <span className="text-white/30 text-xs">cards</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] py-3">
          <span className="text-white/40 text-xs uppercase tracking-wider">Black</span>
          <span className="text-white/90 text-xl font-semibold">{coverage?.black ?? '—'}</span>
          <span className="text-white/30 text-xs">cards</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] py-3">
          <span className="text-white/40 text-xs uppercase tracking-wider">Total</span>
          <span className="text-white/90 text-xl font-semibold">{coverage?.total ?? '—'}</span>
          <span className="text-white/30 text-xs">cards</span>
        </div>
      </div>

      {nothingDue && (
        <p className="text-white/40 text-xs text-center">
          All caught up — no cards due right now.
        </p>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!coverage || coverage.total === 0 || nothingDue}
        className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-default"
      >
        Start Session
      </button>
    </div>
  )
}
