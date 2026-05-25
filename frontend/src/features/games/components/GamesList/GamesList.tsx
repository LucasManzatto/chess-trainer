import { memo } from 'react'
import type { Game, GamesFilters, SyncStatus } from '../../types'
import { SyncControls } from '../GamesTab/SyncControls'

type ResultBadgeProps = { result: Game['result'] }

function ResultBadge({ result }: ResultBadgeProps) {
  const map = {
    win:  { label: 'W', cls: 'bg-green-500/20 text-green-400' },
    loss: { label: 'L', cls: 'bg-red-500/20 text-red-400' },
    draw: { label: 'D', cls: 'bg-gray-500/20 text-gray-400' },
  }
  const { label, cls } = map[result]
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0 ${cls}`}>
      {label}
    </span>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeControlLabel(tc: string | null): string {
  if (!tc) return ''
  const secs = parseInt(tc.split('+')[0] ?? tc)
  if (isNaN(secs)) return tc
  if (secs < 180)  return '⚡'  // bullet
  if (secs < 600)  return '⏱'  // blitz
  return ''                      // rapid+
}

type GameRowProps = {
  game: Game
  selected: boolean
  username: string
  onSelect: (game: Game) => void
}

function GameRow({ game, selected, username, onSelect }: GameRowProps) {
  const opponent = game.user_color === 'white' ? game.black_username : game.white_username
  const opponentRating = game.user_color === 'white' ? game.black_rating : game.white_rating

  return (
    <button
      onClick={() => onSelect(game)}
      className={`w-full text-left px-3 py-2.5 border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${
        selected ? 'bg-amber-500/10 border-l-2 border-l-amber-500/60' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <ResultBadge result={game.result} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm text-gray-200 truncate font-medium">
              vs {opponent}
            </span>
            {opponentRating && (
              <span className="text-xs text-gray-500 flex-shrink-0">({opponentRating})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {game.opening_name && (
              <span className="text-xs text-gray-500 truncate">{game.opening_name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {game.analysis ? (
            <span className="text-xs text-blue-400 font-mono">
              {game.analysis.white_accuracy.toFixed(0)}% / {game.analysis.black_accuracy.toFixed(0)}%
            </span>
          ) : (
            <span className="text-xs text-gray-600">{timeControlLabel(game.time_control)}</span>
          )}
          <span className="text-xs text-gray-600">{formatDate(game.played_at)}</span>
        </div>
      </div>
    </button>
  )
}

type FilterToggleProps<T extends string> = {
  value: T | null
  options: { label: string; value: T }[]
  onChange: (v: T | null) => void
}

function FilterToggle<T extends string>({ value, options, onChange }: FilterToggleProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            value === opt.value
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

type GamesListProps = {
  games: Game[]
  isLoading: boolean
  selectedId: number | null
  username: string
  filters: GamesFilters
  total: number
  syncStatus: SyncStatus | null
  isRunning: boolean
  onSelect: (game: Game) => void
  onResultChange: (v: GamesFilters['result']) => void
  onColorChange: (v: GamesFilters['color']) => void
  onTimeClassChange: (v: GamesFilters['time_class']) => void
  onSync: () => void
}

export const GamesList = memo(function GamesList({
  games,
  isLoading,
  selectedId,
  username,
  filters,
  total,
  syncStatus,
  isRunning,
  onSelect,
  onResultChange,
  onColorChange,
  onTimeClassChange,
  onSync,
}: GamesListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Filters header */}
      <div className="px-3 py-2 border-b border-white/[0.06] flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Games
            </span>
            <span className="text-xs text-gray-600">{total}</span>
          </div>
          <SyncControls isRunning={isRunning} syncStatus={syncStatus} onSync={onSync} />
        </div>
        <FilterToggle
          value={filters.result}
          options={[
            { label: 'W', value: 'win' as const },
            { label: 'L', value: 'loss' as const },
            { label: 'D', value: 'draw' as const },
          ]}
          onChange={onResultChange}
        />
        <FilterToggle
          value={filters.color}
          options={[
            { label: '♔ White', value: 'white' as const },
            { label: '♚ Black', value: 'black' as const },
          ]}
          onChange={onColorChange}
        />
        <FilterToggle
          value={filters.time_class}
          options={[
            { label: 'Bullet', value: 'bullet' as const },
            { label: 'Blitz', value: 'blitz' as const },
            { label: 'Rapid', value: 'rapid' as const },
          ]}
          onChange={onTimeClassChange}
        />
      </div>

      {/* Games list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-gray-600 text-sm">
            Loading…
          </div>
        ) : games.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-600 text-sm text-center px-4">
            No games found
          </div>
        ) : (
          games.map(g => (
            <GameRow
              key={g.id}
              game={g}
              selected={g.id === selectedId}
              username={username}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
})
