import type { SyncStatus } from '../../types'

type SyncControlsProps = {
  isRunning: boolean
  syncStatus: SyncStatus | null
  onSync: () => void
  isAnalyzingAll: boolean
  analyzeAllProgress: { current: number; total: number }
  pendingAnalyzeCount: number
  onAnalyzeAll: () => void
}

export function SyncControls({
  isRunning,
  syncStatus,
  onSync,
  isAnalyzingAll,
  analyzeAllProgress,
  pendingAnalyzeCount,
  onAnalyzeAll,
}: SyncControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {isRunning && syncStatus && (
        <span className="text-xs text-gray-500">
          {syncStatus.current_month ?? 0}/{syncStatus.total_months ?? '?'} months
          {syncStatus.games_added != null ? ` · ${syncStatus.games_added} games` : ''}
        </span>
      )}
      {isAnalyzingAll && (
        <span className="text-xs text-gray-500">
          {analyzeAllProgress.current}/{analyzeAllProgress.total} games
        </span>
      )}
      <button
        onClick={onAnalyzeAll}
        disabled={isAnalyzingAll || pendingAnalyzeCount === 0}
        className="text-xs px-3 py-1.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzingAll ? 'Analysing…' : 'Analyse All'}
      </button>
      <button
        onClick={onSync}
        disabled={isRunning}
        className="text-xs px-3 py-1.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  )
}
