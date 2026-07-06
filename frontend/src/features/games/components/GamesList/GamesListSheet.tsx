import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GamesListHeader, GameList } from './GamesList'
import { SyncControls } from '../GamesTab/SyncControls'
import type { AnalyzeStatus, Game, GamesFilters, SyncStatus } from '../../types'

type GamesListSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  games: Game[]
  total: number
  isLoading: boolean
  isSelected: (gameId: number) => boolean
  filters: GamesFilters
  onFiltersChange: (patch: Partial<GamesFilters>) => void
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
  onSelect: (gameId: number) => void
  onAnalyze: () => void
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
  total,
  isLoading,
  isSelected,
  filters,
  onFiltersChange,
  analyzeStatus,
  analyzeProgress,
  onSelect,
  onAnalyze,
  syncControls,
}: GamesListSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[30vw] data-[side=right]:sm:max-w-none flex flex-col p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Games</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Loading…
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="px-3 pt-2 flex justify-end">
              <SyncControls {...syncControls} />
            </div>
            <GamesListHeader total={total} filters={filters} onFiltersChange={onFiltersChange} />
            <GameList
              games={games}
              isSelected={isSelected}
              analyzeStatus={analyzeStatus}
              analyzeProgress={analyzeProgress}
              onSelect={onSelect}
              onAnalyze={onAnalyze}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
