import { useState } from 'react'
import type { Opening } from '../../types'
import { OpeningsNameTree } from './OpeningsNameTree'
import { OpeningsMoveTree } from './OpeningsMoveTree'

type ViewMode = 'list' | 'name' | 'move'

type Props = {
  openings: Opening[]
  isLoading?: boolean
  selectedId?: number
  search?: string
  onSearchChange?: (s: string) => void
  onSelect?: (o: Opening) => void
  defaultViewMode?: ViewMode
}

export function OpeningsList({
  openings,
  isLoading,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  defaultViewMode = 'list',
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

  return (
    <>
      <div className="border-b border-white/[0.06]">
        <div className="px-3 h-10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Openings</span>
          <div className="flex gap-0.5">
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
        {!isLoading && openings.length === 0 && (
          <p className="text-gray-500 text-sm p-3">No openings found</p>
        )}
        {!isLoading && openings.length > 0 && viewMode === 'list' && (
          <div className="py-1">
            {openings.map(o =>
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
                  <span className="truncate">{o.name}</span>
                </button>
              ) : (
                <div
                  key={o.id}
                  className={`pl-2 pr-3 py-1.5 text-sm border-l-2 flex items-center gap-2 min-w-0 ${
                    selectedId === o.id ? 'border-amber-400 text-amber-300 font-semibold' : 'border-transparent text-gray-400'
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                </div>
              )
            )}
          </div>
        )}
        {!isLoading && openings.length > 0 && viewMode === 'name' && (
          <OpeningsNameTree openings={openings} selectedId={selectedId} onSelect={onSelect} />
        )}
        {!isLoading && openings.length > 0 && viewMode === 'move' && (
          <OpeningsMoveTree openings={openings} selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>
    </>
  )
}
