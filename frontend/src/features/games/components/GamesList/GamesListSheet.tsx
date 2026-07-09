import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GamesListHeader, GameList } from './GamesList'
import { SyncControls } from '../GamesTab/SyncControls'
import type { AnalyzeStatus, Game, GamesFilters, SyncStatus } from '../../types'

type GamesListSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  games: {
    items: Game[]
    total: number
    isLoading: boolean
  }
  filters: {
    value: GamesFilters
    onChange: (patch: Partial<GamesFilters>) => void
  }
  rowState: {
    isSelected: (gameId: number) => boolean
    analyzeStatus: AnalyzeStatus
    analyzeProgress: { current: number; total: number }
  }
  rowActions: {
    onSelect: (gameId: number) => void
    onAnalyze: () => void
    onToggleReviewed: (gameId: number, reviewed: boolean) => void
  }
  syncControls: {
    isRunning: boolean
    syncStatus: SyncStatus | null
    onSync: () => void
    isAnalyzingAll: boolean
    analyzeAllProgress: { current: number; total: number }
    pendingAnalyzeCount: number
    onAnalyzeAll: () => void
  }
}

export function GamesListSheet({
  open,
  onOpenChange,
  games,
  filters,
  rowState,
  rowActions,
  syncControls,
}: GamesListSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:w-[30vw] data-[side=right]:sm:max-w-none flex flex-col p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Games</SheetTitle>
        </SheetHeader>
        {games.isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Loading…
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="px-3 pt-2 flex justify-end">
              <SyncControls {...syncControls} />
            </div>
            <GamesListHeader total={games.total} filters={filters.value} onFiltersChange={filters.onChange} />
            <GameList
              games={games.items}
              isSelected={rowState.isSelected}
              analyzeStatus={rowState.analyzeStatus}
              analyzeProgress={rowState.analyzeProgress}
              onSelect={rowActions.onSelect}
              onAnalyze={rowActions.onAnalyze}
              onToggleReviewed={rowActions.onToggleReviewed}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
