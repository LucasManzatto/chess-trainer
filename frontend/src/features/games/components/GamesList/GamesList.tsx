import { memo, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Game, GamesListResponse } from '../../types'
import type { useGamesSync } from '../../../../data/hooks/useGames'
import { SyncControls } from '../GamesTab/SyncControls'
import { timeControlLabel } from '../../utils/gameFormatters'

// ─── ResultBadge ─────────────────────────────────────────────────────────────

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

// ─── FilterToggle ─────────────────────────────────────────────────────────────

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

// ─── GamesFilters ─────────────────────────────────────────────────────────────

const RESULT_OPTIONS = [
  { label: 'W', value: 'win' as const },
  { label: 'L', value: 'loss' as const },
  { label: 'D', value: 'draw' as const },
]

const COLOR_OPTIONS = [
  { label: '♔ White', value: 'white' as const },
  { label: '♚ Black', value: 'black' as const },
]

const TIME_CLASS_OPTIONS = [
  { label: 'Bullet', value: 'bullet' as const },
  { label: 'Blitz', value: 'blitz' as const },
  { label: 'Rapid', value: 'rapid' as const },
  { label: 'Daily', value: 'daily' as const },
]

function GamesFilters() {
  const navigate = useNavigate()
  const { result, color, time_class } = useSearch({ from: '/_auth/games/list' })

  const setFilter = useCallback(
    (patch: Partial<{ result: typeof result; color: typeof color; time_class: typeof time_class }>) =>
      navigate({ from: '/games/list', to: '/games/list', search: prev => ({ ...prev, ...patch }), replace: true }),
    [navigate],
  )

  return (
    <>
      <FilterToggle value={result} options={RESULT_OPTIONS} onChange={v => setFilter({ result: v })} />
      <FilterToggle value={color} options={COLOR_OPTIONS} onChange={v => setFilter({ color: v })} />
      <FilterToggle value={time_class} options={TIME_CLASS_OPTIONS} onChange={v => setFilter({ time_class: v })} />
    </>
  )
}

// ─── GameRow ──────────────────────────────────────────────────────────────────

type GameRowProps = {
  game: Game
  selected: boolean
  onSelect: (game: Game) => void
}

function GameRow({ game, selected, onSelect }: GameRowProps) {
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
          <span className="text-xs text-gray-600">{timeControlLabel(game.time_control)}</span>
          {game.analysis && (
            <span className="text-xs text-blue-400" title="Analysed">⬡</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── GamesListHeader ──────────────────────────────────────────────────────────

type GamesListHeaderProps = {
  total: number
  syncStatus: ReturnType<typeof useGamesSync>['syncStatus']
  isRunning: boolean
  onSync: () => void
}

function GamesListHeader({ total, syncStatus, isRunning, onSync }: GamesListHeaderProps) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.06] flex flex-col gap-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Games</span>
          <span className="text-xs text-gray-600">{total}</span>
        </div>
        <SyncControls isRunning={isRunning} syncStatus={syncStatus} onSync={onSync} />
      </div>
      <GamesFilters />
    </div>
  )
}

// ─── GameList ─────────────────────────────────────────────────────────────────

type GameListProps = {
  games: Game[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (game: Game) => void
}

function GameList({ games, isLoading, selectedId, onSelect }: GameListProps) {
  return (
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
          <GameRow key={g.id} game={g} selected={g.id === selectedId} onSelect={onSelect} />
        ))
      )}
    </div>
  )
}

// ─── GamesList ────────────────────────────────────────────────────────────────

type GamesListProps = {
  gamesData: GamesListResponse | undefined
  isLoading: boolean
  selectedId: number | null
  syncStatus: ReturnType<typeof useGamesSync>['syncStatus']
  isRunning: boolean
  onSync: () => void
  onSelect: (game: Game) => void
}

export const GamesList = memo(function GamesList({
  gamesData,
  isLoading,
  selectedId,
  syncStatus,
  isRunning,
  onSync,
  onSelect,
}: GamesListProps) {
  return (
    <div className="flex flex-col h-full">
      <GamesListHeader total={gamesData?.total ?? 0} syncStatus={syncStatus} isRunning={isRunning} onSync={onSync} />
      <GameList games={gamesData?.items ?? []} isLoading={isLoading} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
})
