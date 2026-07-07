import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CoverageStats, RepertoireCard, TrainMode, TrainPhase } from '../types'
import { ResetCardsButton } from './ResetCardsButton'

interface TrainSetupProps {
  mode: TrainMode
  setMode: (mode: TrainMode) => void
  setPhase: (phase: TrainPhase) => void
  coverage: CoverageStats | undefined
  dueCards: RepertoireCard[]
}

export function TrainSetup({ mode, setMode, setPhase, coverage, dueCards }: TrainSetupProps) {
  const nothingDue = !!coverage && coverage.total > 0 && dueCards.length === 0

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-10 w-full max-w-sm mx-auto select-none">
      <h1
        className="text-white/90 text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Train
      </h1>

      {/* Mode tabs */}
      <ToggleGroup
        value={[mode]}
        onValueChange={(v: string[]) => v[0] && setMode(v[0] as TrainMode)}
        variant="outline"
        spacing={0}
        className="w-full"
      >
        <ToggleGroupItem value="drill" className="flex-1">
          Drill
        </ToggleGroupItem>
        <ToggleGroupItem value="spar" className="flex-1">
          Spar
        </ToggleGroupItem>
      </ToggleGroup>

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

      <Button
        onClick={() => setPhase({ type: 'loading' })}
        disabled={dueCards.length === 0}
        className="w-full h-auto py-2.5 bg-amber-400/15 border border-amber-400/20 text-amber-300 hover:bg-amber-400/25"
      >
        Start Session
      </Button>

      <ResetCardsButton />
    </div>
  )
}
