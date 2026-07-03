import { useStats } from '../../../data/hooks/useTrain'

interface SessionSummaryProps {
  onTrainAgain: () => void
  onBack: () => void
}

export function SessionSummary({ onTrainAgain, onBack }: SessionSummaryProps) {
  const { data: stats } = useStats()

  const reviewed = stats?.review ?? 0
  const total = stats?.total ?? 0

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10 w-full max-w-sm mx-auto select-none">
      {/* Stats */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-amber-300 font-semibold leading-none"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '56px' }}
        >
          {reviewed}
        </span>
        <span className="text-white/40 text-sm">
          reviewed out of {total} cards
        </span>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-white/[0.08]" />

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onTrainAgain}
          className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold text-sm transition-colors"
        >
          Train Again
        </button>
        <button
          onClick={onBack}
          className="w-full py-2.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 text-sm font-medium transition-colors"
        >
          Back to Setup
        </button>
      </div>
    </div>
  )
}
