import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { AnalyzeStatus, Game } from '../../types'
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

// ─── AnalyzeRowAction ─────────────────────────────────────────────────────────

type AnalyzeRowActionProps = {
  hasAnalysis: boolean
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
  onAnalyze: () => void
}

function AnalyzeRowAction({ hasAnalysis, analyzeStatus, analyzeProgress, onAnalyze }: AnalyzeRowActionProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {analyzeStatus === 'running' && (
        <span className="text-[10px] text-gray-500">
          {analyzeProgress.current}/{analyzeProgress.total}
        </span>
      )}
      {!hasAnalysis && (
        <button
          onClick={e => { e.stopPropagation(); onAnalyze() }}
          disabled={analyzeStatus === 'running'}
          title={analyzeStatus === 'running' ? 'Analyzing…' : 'Analyze'}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            analyzeStatus === 'running'
              ? 'bg-white/5 text-gray-600 cursor-not-allowed animate-spin'
              : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
          }`}
        >
          ⬡
        </button>
      )}
    </div>
  )
}

// ─── GamesListHeader ──────────────────────────────────────────────────────────

export type GamesListHeaderProps = {
  total: number
}

export function GamesListHeader({ total }: GamesListHeaderProps) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.06] flex flex-col gap-2 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Games</span>
        <span className="text-xs text-gray-600">{total}</span>
      </div>
      <GamesFilters />
    </div>
  )
}

// ─── GameList ─────────────────────────────────────────────────────────────────

export type GameListProps = {
  games: Game[]
  isSelected: (gameId: number) => boolean
  analyzeStatus: AnalyzeStatus
  analyzeProgress: { current: number; total: number }
  onSelect: (gameId: number) => void
  onAnalyze: () => void
}

export function GameList({ games, isSelected, analyzeStatus, analyzeProgress, onSelect, onAnalyze }: GameListProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {games.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-gray-600 text-sm text-center px-4">
          No games found
        </div>
      ) : (
        games.map(g => {
          const opponent = g.user_color === 'white' ? g.black_username : g.white_username
          const opponentRating = g.user_color === 'white' ? g.black_rating : g.white_rating
          const isAnalysed = !!g.analysis
          const selected = isSelected(g.id)
          const hasAnalysis = isAnalysed || (selected && analyzeStatus === 'done')

          return (
            <div
              key={g.id}
              className={`flex items-stretch border-b border-white/[0.04] transition-colors ${
                selected ? 'bg-amber-500/10 border-l-2 border-l-amber-500/60' : ''
              }`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(g.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(g.id) }}
                className="flex-1 min-w-0 flex items-center gap-2 text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <ResultBadge result={g.result} />
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
                    {g.opening_name && (
                      <span className="text-xs text-gray-500 truncate">{g.opening_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-xs text-gray-600">{timeControlLabel(g.time_control)}</span>
                </div>
                <AnalyzeRowAction
                  hasAnalysis={hasAnalysis}
                  analyzeStatus={selected ? analyzeStatus : 'idle'}
                  analyzeProgress={analyzeProgress}
                  onAnalyze={onAnalyze}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
