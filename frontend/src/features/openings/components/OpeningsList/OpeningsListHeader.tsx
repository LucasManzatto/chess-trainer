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
  return (
    <div className="px-4 h-11 flex items-center justify-between border-b border-white/[0.08]">
      <span
        className="text-white/80 font-semibold tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px' }}
      >
        Openings
      </span>
      <div className="flex items-center gap-1">
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
