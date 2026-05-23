import type { Opening } from '../../types'
import { EcoFilter } from './EcoFilter'
import type { EcoGroup } from './EcoFilter'

type Props = {
  openings: Opening[]
  isLoading?: boolean
  selectedId?: number
  search?: string
  ecoGroup?: EcoGroup
  onSearchChange?: (s: string) => void
  onEcoChange?: (g: EcoGroup) => void
  onSelect?: (o: Opening) => void
}

export function OpeningsList({
  openings,
  isLoading,
  selectedId,
  search,
  ecoGroup,
  onSearchChange,
  onEcoChange,
  onSelect,
}: Props) {
  const hasFilters = onSearchChange || onEcoChange

  return (
    <>
      {hasFilters && (
        <div className="p-3 space-y-2 border-b border-white/10">
          {onSearchChange && (
            <input
              type="text"
              placeholder="Search openings…"
              value={search ?? ''}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
            />
          )}
          {onEcoChange && ecoGroup !== undefined && (
            <EcoFilter ecoGroup={ecoGroup} onChange={onEcoChange} />
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Openings</div>
        {isLoading && <p className="text-gray-500 text-sm p-3">Loading openings…</p>}
        {!isLoading && openings.length === 0 && (
          <p className="text-gray-500 text-sm p-3">No openings found</p>
        )}
        {openings.map(o =>
          onSelect ? (
            <button
              key={o.id}
              onClick={() => onSelect(o)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-white/5 transition-colors ${
                selectedId === o.id
                  ? 'bg-amber-500/15 text-amber-200'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-gray-500 font-mono text-xs mr-2">{o.eco}</span>
              {o.name}
            </button>
          ) : (
            <div
              key={o.id}
              className={`px-3 py-1.5 text-sm border-b border-white/5 ${
                selectedId === o.id ? 'text-amber-300 font-semibold' : 'text-gray-400'
              }`}
            >
              <span className="text-gray-500 font-mono text-xs mr-2">{o.eco}</span>
              {o.name}
            </div>
          )
        )}
      </div>
    </>
  )
}
