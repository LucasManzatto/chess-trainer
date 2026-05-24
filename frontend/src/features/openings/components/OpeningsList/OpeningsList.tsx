import type { Opening } from '../../types'
import { openingColor } from '../../types'
import { useOpeningsList, type ViewMode } from './useOpeningsList'
import { OpeningsNameTree } from './OpeningsNameTree'
import { OpeningsMoveTree } from './OpeningsMoveTree'

type Props = {
  openings: Opening[]
  isLoading?: boolean
  selectedId?: number
  selectedName?: string
  search?: string
  onSearchChange?: (s: string) => void
  onSelect?: (o: Opening) => void
  defaultViewMode?: ViewMode
}

function ColorBadge({ opening }: { opening: Opening }) {
  const color = openingColor(opening)
  return (
    <span className={`text-[10px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0 ${
      color === 'white' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-200'
    }`}>
      {color === 'white' ? 'W' : 'B'}
    </span>
  )
}

function StarIcon({ filled, dim }: { filled: boolean; dim?: boolean }) {
  return (
    <span className={`text-xs flex-shrink-0 ${filled ? (dim ? 'text-amber-400/40' : 'text-amber-400') : 'text-gray-600'}`}>
      {filled ? '★' : '☆'}
    </span>
  )
}

export function OpeningsList({
  openings,
  isLoading,
  selectedId,
  selectedName,
  search,
  onSearchChange,
  onSelect,
  defaultViewMode = 'list',
}: Props) {
  const {
    viewMode,
    setViewMode,
    showFavoritesOnly,
    toggleFavoritesFilter,
    favoriteIds,
    toggleFavorite,
    bulkToggle,
    displayed,
  } = useOpeningsList(openings, defaultViewMode)

  return (
    <>
      <div className="border-b border-white/[0.06]">
        <div className="px-3 h-10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Openings</span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFavoritesFilter}
              title="Show favorites only"
              className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                showFavoritesOnly ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              ★
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            {(['list', 'name', 'move'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
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
        {onSearchChange && (
          <div className="px-3 pb-2">
            <input
              type="text"
              placeholder="Search openings…"
              value={search ?? ''}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded-md px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="text-gray-500 text-sm p-3">Loading openings…</p>}
        {!isLoading && displayed.length === 0 && (
          <p className="text-gray-500 text-sm p-3">No openings found</p>
        )}
        {!isLoading && displayed.length > 0 && viewMode === 'list' && (
          <div className="py-1">
            {displayed.map(o =>
              onSelect ? (
                <button
                  key={o.id}
                  onClick={() => onSelect(o)}
                  className={`w-full text-left pl-2 pr-3 py-1.5 text-sm transition-colors flex items-center gap-2 min-w-0 ${
                    selectedId === o.id
                      ? 'border-l-2 border-amber-400 bg-amber-500/10 text-amber-200'
                      : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <ColorBadge opening={o} />
                  <span className="truncate flex-1">{o.name}</span>
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); toggleFavorite(o.id) }}
                    className="flex-shrink-0"
                  >
                    <StarIcon filled={favoriteIds.has(o.id)} />
                  </span>
                </button>
              ) : (
                <div
                  key={o.id}
                  className={`pl-2 pr-3 py-1.5 text-sm border-l-2 flex items-center gap-2 min-w-0 ${
                    selectedId === o.id ? 'border-amber-400 text-amber-300 font-semibold' : 'border-transparent text-gray-400'
                  }`}
                >
                  <ColorBadge opening={o} />
                  <span className="truncate flex-1">{o.name}</span>
                  <StarIcon filled={favoriteIds.has(o.id)} />
                </div>
              )
            )}
          </div>
        )}
        {!isLoading && displayed.length > 0 && viewMode === 'name' && (
          <OpeningsNameTree
            openings={displayed}
            selectedId={selectedId}
            selectedName={selectedName}
            onSelect={onSelect}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onBulkToggle={bulkToggle}
          />
        )}
        {!isLoading && displayed.length > 0 && viewMode === 'move' && (
          <OpeningsMoveTree
            openings={displayed}
            selectedId={selectedId}
            onSelect={onSelect}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onBulkToggle={bulkToggle}
          />
        )}
      </div>
    </>
  )
}
