import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrainSetup } from './TrainSetup'
import type { CoverageStats, RepertoireCard, TrainMode } from '../types'

type TrainSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: TrainMode
  onModeChange: (mode: TrainMode) => void
  coverage: CoverageStats | undefined
  dueCards: RepertoireCard[]
}

export function TrainSheet({ open, onOpenChange, mode, onModeChange, coverage, dueCards }: TrainSheetProps) {
  const [localMode, setLocalMode] = useState(mode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-[calc(100%-2rem)] w-[39vw] flex-col p-0 sm:max-w-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === 'drill' ? 'Drill' : 'Spar'}</DialogTitle>
        </DialogHeader>
        {open && (
          <TrainSetup
            mode={localMode}
            setMode={setLocalMode}
            setPhase={() => onModeChange(localMode)}
            coverage={coverage}
            dueCards={dueCards}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
