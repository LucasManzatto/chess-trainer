import { useEffect, useState } from 'react'
import { CheckIcon, InboxIcon, ScanSearchIcon } from 'lucide-react'
import type { AnalyzeStatus, Game, GamesFilters as GamesFiltersValue } from '../../types'
import { timeControlLabel } from '../../utils/gameFormatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

// ─── ResultBadge ─────────────────────────────────────────────────────────────

type ResultBadgeProps = { result: Game['result'] }

const RESULT_BADGE = {
  win: { label: 'W', variant: 'default' as const },
  loss: { label: 'L', variant: 'destructive' as const },
  draw: { label: 'D', variant: 'secondary' as const },
}

function ResultBadge({ result }: ResultBadgeProps) {
  const { label, variant } = RESULT_BADGE[result]
  return (
    <Badge variant={variant} className="size-5 shrink-0 justify-center rounded p-0 font-bold">
      {label}
    </Badge>
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
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(v: string[]) => onChange((v[0] as T | undefined) ?? null)}
      variant="outline"
      size="sm"
    >
      {options.map(opt => (
        <ToggleGroupItem key={opt.value} value={opt.value}>
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// ─── FirstCriticalMoveFilter ────────────────────────────────────────────────

type FirstCriticalMoveFilterProps = {
  value: number | null
  onChange: (v: number | null) => void
}

function FirstCriticalMoveFilter({ value, onChange }: FirstCriticalMoveFilterProps) {
  const [draft, setDraft] = useState(value !== null ? String(value) : '')

  useEffect(() => {
    setDraft(value !== null ? String(value) : '')
  }, [value])

  const commit = () => {
    const n = draft === '' ? null : Number(draft)
    onChange(n !== null && n >= 1 ? n : null)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">First critical moment in:</span>
      <Input
        type="number"
        min={1}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="h-7 w-16"
      />
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

const REVIEWED_OPTIONS = [
  { label: 'Unreviewed', value: 'unreviewed' as const },
  { label: 'Reviewed', value: 'reviewed' as const },
]

type GamesFiltersProps = {
  filters: GamesFiltersValue
  onFiltersChange: (patch: Partial<GamesFiltersValue>) => void
}

function GamesFilters({ filters, onFiltersChange }: GamesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterToggle value={filters.result} options={RESULT_OPTIONS} onChange={v => onFiltersChange({ result: v })} />
      <FilterToggle value={filters.color} options={COLOR_OPTIONS} onChange={v => onFiltersChange({ color: v })} />
      <ToggleGroup
        value={filters.has_critical_moves ? ['critical'] : []}
        onValueChange={(v: string[]) => onFiltersChange({ has_critical_moves: v.length > 0 ? true : null })}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="critical">Critical moments</ToggleGroupItem>
      </ToggleGroup>
      <FilterToggle
        value={filters.reviewed === null ? null : filters.reviewed ? 'reviewed' : 'unreviewed'}
        options={REVIEWED_OPTIONS}
        onChange={v => onFiltersChange({ reviewed: v === null ? null : v === 'reviewed' })}
      />
      <FirstCriticalMoveFilter
        value={filters.first_critical_move}
        onChange={v => onFiltersChange({ first_critical_move: v })}
      />
    </div>
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
  const running = analyzeStatus === 'running'
  return (
    <div className="flex flex-col items-center gap-1">
      {running && (
        <span className="text-[10px] text-muted-foreground">
          {analyzeProgress.current}/{analyzeProgress.total}
        </span>
      )}
      {!hasAnalysis && (
        <Button
          variant="destructive"
          size="icon-xs"
          disabled={running}
          title={running ? 'Analyzing…' : 'Analyze'}
          onClick={e => { e.stopPropagation(); onAnalyze() }}
        >
          {running ? <Spinner /> : <ScanSearchIcon />}
        </Button>
      )}
    </div>
  )
}

// ─── ReviewedRowAction ─────────────────────────────────────────────────────────

type ReviewedRowActionProps = {
  reviewed: boolean
  onToggleReviewed: () => void
}

function ReviewedRowAction({ reviewed, onToggleReviewed }: ReviewedRowActionProps) {
  return (
    <Button
      variant={reviewed ? 'default' : 'outline'}
      size="icon-xs"
      title={reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
      onClick={e => { e.stopPropagation(); onToggleReviewed() }}
    >
      <CheckIcon />
    </Button>
  )
}

// ─── GamesListHeader ──────────────────────────────────────────────────────────

export type GamesListHeaderProps = {
  total: number
  filters: GamesFiltersValue
  onFiltersChange: (patch: Partial<GamesFiltersValue>) => void
}

export function GamesListHeader({ total, filters, onFiltersChange }: GamesListHeaderProps) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Games</span>
        <Badge variant="secondary">{total}</Badge>
      </div>
      <GamesFilters filters={filters} onFiltersChange={onFiltersChange} />
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
  onToggleReviewed: (gameId: number, reviewed: boolean) => void
}

export function GameList({ games, isSelected, analyzeStatus, analyzeProgress, onSelect, onAnalyze, onToggleReviewed }: GameListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {games.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No games found</EmptyTitle>
            <EmptyDescription>Try adjusting your filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        games.map(g => {
          const opponent = g.user_color === 'white' ? g.black_username : g.white_username
          const opponentRating = g.user_color === 'white' ? g.black_rating : g.white_rating
          const isAnalysed = !!g.analysis
          const selected = isSelected(g.id)
          const hasAnalysis = isAnalysed || (selected && analyzeStatus === 'done')
          const criticalCount = g.critical_moves?.length ?? 0
          const firstCriticalMoveNumber = criticalCount > 0 ? Math.floor(g.critical_moves![0] / 2) + 1 : null

          return (
            <div
              key={g.id}
              className={cn(
                'flex items-stretch border-b border-border/60 transition-colors',
                selected && 'border-l-2 border-l-primary bg-primary/10',
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(g.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(g.id) }}
              >
                <ResultBadge result={g.result} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      vs {opponent}
                    </span>
                    {opponentRating && (
                      <span className="shrink-0 text-xs text-muted-foreground">({opponentRating})</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {g.opening_name && (
                      <span className="truncate text-xs text-muted-foreground">{g.opening_name}</span>
                    )}
                    {criticalCount > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        · {criticalCount} critical{firstCriticalMoveNumber !== null && ` (1st @ move ${firstCriticalMoveNumber})`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-xs text-muted-foreground">{timeControlLabel(g.time_control)}</span>
                </div>
                <ReviewedRowAction
                  reviewed={g.reviewed}
                  onToggleReviewed={() => onToggleReviewed(g.id, !g.reviewed)}
                />
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
