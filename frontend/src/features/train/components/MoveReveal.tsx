import { useReviewCard } from '../../../data/hooks/useTrain'
import { Button } from '@/components/ui/button'
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

interface GradeButtonsProps {
  card: RepertoireCard | null
  onGrade: () => void
}

export function GradeButtons({ card, onGrade }: GradeButtonsProps) {
  const { mutate: reviewCard, isPending } = useReviewCard()

  return (
    <div className="grid grid-cols-4 gap-2 select-none">
      {GRADES.map(({ label, interval, color, grade }) => (
        <Button
          key={label}
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (card) {
              reviewCard({ position_id: card.position_id, grade }, { onSuccess: onGrade })
            }
          }}
          className={`h-auto flex-col gap-0.5 py-2 px-1 bg-transparent ${color}`}
        >
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-[10px] opacity-60">{interval}</span>
        </Button>
      ))}
    </div>
  )
}
