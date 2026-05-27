type ViewMode = 'list' | 'name' | 'move'

interface OpeningsListHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function OpeningsListHeader({ viewMode, onViewModeChange }: OpeningsListHeaderProps) {
  return (
    <div className="px-3 h-10 flex items-center justify-between border-b border-white/[0.06]">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Openings</span>
      <div className="flex items-center gap-1">
        <button className="text-sm px-1.5 py-0.5 rounded transition-colors text-gray-600 hover:text-gray-300">
          ★
        </button>
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        {(['list', 'name', 'move'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              viewMode === mode
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
