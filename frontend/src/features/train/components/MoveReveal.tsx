import { useReviewCard } from '../hooks/useReviewCard'
import type { CardReview, RepertoireCard } from '../types'

type Grade = CardReview['grade']

// Grades 1 and 4 are valid API values but intentionally omitted — UI uses a simplified 4-step scale.
const GRADES: { label: string; grade: Grade; interval: string; color: string }[] = [
  { label: 'Again', grade: 0, interval: '5s', color: 'text-red-400 border-red-400/30 hover:bg-red-400/10' },
  { label: 'Hard',  grade: 2, interval: '1d',  color: 'text-orange-400 border-orange-400/30 hover:bg-orange-400/10' },
  { label: 'Good',  grade: 3, interval: '3d',  color: 'text-green-400 border-green-400/30 hover:bg-green-400/10' },
  { label: 'Easy',  grade: 5, interval: '7d',  color: 'text-sky-400 border-sky-400/30 hover:bg-sky-400/10' },
]
// TODO: compute interval hints from card.interval_days + card.ease (SM-2 estimates)

interface MoveRevealProps {
  correct: boolean
  card: RepertoireCard | null
  onGrade: () => void
}

export function MoveReveal({ correct, card, onGrade }: MoveRevealProps) {
  const { mutate: reviewCard } = useReviewCard()

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {/* Correct / incorrect banner */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          correct
            ? 'bg-green-400/[0.06] border-green-400/20 text-green-400'
            : 'bg-red-400/[0.06] border-red-400/20 text-red-400'
        }`}
      >
        {correct ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        )}
        <span className="text-sm font-medium">
          {correct ? 'Correct!' : 'Incorrect'}
        </span>
      </div>

      {/* Grade buttons */}
      <div className="grid grid-cols-4 gap-2">
        {GRADES.map(({ label, interval, color, grade }) => (
          <button
            key={label}
            onClick={() => {
              if (card) reviewCard({ position_key: card.position_key, grade })
              onGrade()
            }}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border transition-colors ${color}`}
          >
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] opacity-60">{interval}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
