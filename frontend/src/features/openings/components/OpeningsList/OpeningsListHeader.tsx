import { useShallow } from 'zustand/react/shallow'
import { useOpeningsStore } from '../../store/openingsStore'

type ViewMode = 'list' | 'name' | 'move'

interface OpeningsListHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const VIEW_LABELS: Record<ViewMode, string> = {
  list: 'List',
  name: 'Name',
  move: 'Move',
}

export function OpeningsListHeader({ viewMode, onViewModeChange }: OpeningsListHeaderProps) {
  const { historyIndex, historyLength } = useOpeningsStore(useShallow(s => ({
    historyIndex: s.historyIndex,
    historyLength: s.selectionHistory.length,
  })))
  const navigateBack = useOpeningsStore(s => s.navigateBack)
  const navigateForward = useOpeningsStore(s => s.navigateForward)

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < historyLength - 1

  return (
    <div className="px-4 flex flex-col border-b border-white/[0.08]">
      <div className="h-11 flex items-center justify-between">
        <span
          className="text-white/80 font-semibold tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px' }}
        >
          Openings
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            title="Previous opening"
            className="flex items-center justify-center w-6 h-6 rounded transition-colors text-white/30 hover:text-white/70 hover:bg-white/[0.07] disabled:opacity-20 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/30"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            title="Next opening"
            className="flex items-center justify-center w-6 h-6 rounded transition-colors text-white/30 hover:text-white/70 hover:bg-white/[0.07] disabled:opacity-20 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/30"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 py-2">
        <button
          className="text-base px-1.5 py-0.5 rounded transition-colors text-white/20 hover:text-amber-300/60"
          title="Favorites"
        >
          ★
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex items-center bg-white/[0.05] rounded-md p-0.5 gap-0.5">
          {(['list', 'name', 'move'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                viewMode === mode
                  ? 'bg-white/10 text-white/90'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
