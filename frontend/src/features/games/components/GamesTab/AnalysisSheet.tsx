import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AnalysisPanel } from './AnalysisPanel'
import type { Game } from '../../types'

type AnalysisSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: Game | null
  criticalMoveIndices: number[]
}

export function AnalysisSheet({ open, onOpenChange, game, criticalMoveIndices }: AnalysisSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="data-[side=top]:h-[30vh] flex flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Analysis</SheetTitle>
        </SheetHeader>
        <AnalysisPanel game={game} criticalMoveIndices={criticalMoveIndices} />
      </SheetContent>
    </Sheet>
  )
}
