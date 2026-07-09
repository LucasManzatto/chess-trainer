import type { SyncStatus } from '../../types'

type SyncControlsProps = {
  data: {
    syncStatus: SyncStatus | null
    analyzeAllProgress: { current: number; total: number }
    pendingAnalyzeCount: number
  }
  state: {
    sync: 'idle' | 'triggering' | 'running'
    analyzeAll: 'idle' | 'running'
  }
  actions: {
    onSync: () => void
    onAnalyzeAll: () => void
  }
}

export function SyncControls({ data, state, actions }: SyncControlsProps) {
  const syncing = state.sync !== 'idle'
  const analyzing = state.analyzeAll === 'running'

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {syncing && data.syncStatus && (
        <span className="text-xs text-gray-500">
          {data.syncStatus.current_month ?? 0}/{data.syncStatus.total_months ?? '?'} months
          {data.syncStatus.games_added != null ? ` · ${data.syncStatus.games_added} games` : ''}
        </span>
      )}
      {analyzing && (
        <span className="text-xs text-gray-500">
          {data.analyzeAllProgress.current}/{data.analyzeAllProgress.total} games
        </span>
      )}
      <button
        onClick={actions.onAnalyzeAll}
        disabled={analyzing || data.pendingAnalyzeCount === 0}
        className="text-xs px-3 py-1.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? 'Analysing…' : 'Analyse All'}
      </button>
      <button
        onClick={actions.onSync}
        disabled={syncing}
        className="text-xs px-3 py-1.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  )
}
