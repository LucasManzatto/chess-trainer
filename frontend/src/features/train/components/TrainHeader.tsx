import { useResetCards } from '../hooks/useResetCards'
import { useStats } from '../hooks/useStats'
import { useDueCards } from '../hooks/useDueCards'
import type { TrainMode } from '../store/trainStore'

interface TrainHeaderProps {
  mode: TrainMode
  onBack: () => void
}

export function TrainHeader({ mode, onBack }: TrainHeaderProps) {
  const { mutate: resetCards } = useResetCards()
  const { data: stats } = useStats()
  const { data: dueCards = [] } = useDueCards()

  return (
    <div className="flex items-center w-full px-2 gap-2 select-none">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Mode label */}
      <span className="flex-1 text-center text-white/60 text-sm font-medium capitalize">
        {mode}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {stats && (
          <span className="text-white/50 text-xs">
            <span className="text-white/90 font-semibold">{stats.review}</span>
            <span className="text-white/30">/</span>
            <span>{stats.total}</span>
          </span>
        )}
        {dueCards.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 text-xs font-medium">
            {dueCards.length}
          </span>
        )}
      </div>
    </div>
  )
}
