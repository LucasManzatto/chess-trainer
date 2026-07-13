import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GamesListHeader, GameList } from './GamesList'
import { SyncControls } from '../GamesTab/SyncControls'
import type { AnalyzeStatus, Game, GamesFilters, SyncStatus } from '../../types'

type GamesListSheetProps = {
  data: {
    games: Game[]
    total: number
    syncStatus: SyncStatus | null
    analyzeAllProgress: { current: number; total: number }
    pendingAnalyzeCount: number
  }
  state: {
    open: boolean
    status: 'pending' | 'error' | 'success'
    filters: GamesFilters
    isSelected: (gameId: number) => boolean
    analyzeStatus: AnalyzeStatus
    analyzeProgress: { current: number; total: number }
    sync: 'idle' | 'triggering' | 'running'
    analyzeAll: 'idle' | 'running'
  }
  actions: {
    onOpenChange: (open: boolean) => void
    onFiltersChange: (patch: Partial<GamesFilters>) => void
    onSelect: (game: Game) => void
    onAnalyze: () => void
    onToggleReviewed: (gameId: number, reviewed: boolean) => void
    onSync: () => void
    onAnalyzeAll: () => void
  }
}

export function GamesListSheet({ data, state, actions }: GamesListSheetProps) {
  return (
    <Sheet open={state.open} onOpenChange={actions.onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:w-[30vw] data-[side=right]:sm:max-w-none flex flex-col p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Games</SheetTitle>
        </SheetHeader>
        {state.status === 'pending' ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Loading…
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="px-3 pt-2 flex justify-end">
              <SyncControls
                data={{
                  syncStatus: data.syncStatus,
                  analyzeAllProgress: data.analyzeAllProgress,
                  pendingAnalyzeCount: data.pendingAnalyzeCount,
                }}
                state={{ sync: state.sync, analyzeAll: state.analyzeAll }}
                actions={{ onSync: actions.onSync, onAnalyzeAll: actions.onAnalyzeAll }}
              />
            </div>
            <GamesListHeader total={data.total} filters={state.filters} onFiltersChange={actions.onFiltersChange} />
            <GameList
              games={data.games}
              isSelected={state.isSelected}
              analyzeStatus={state.analyzeStatus}
              analyzeProgress={state.analyzeProgress}
              onSelect={actions.onSelect}
              onAnalyze={actions.onAnalyze}
              onToggleReviewed={actions.onToggleReviewed}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
