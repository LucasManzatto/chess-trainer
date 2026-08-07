import { useEffect, useState, type ReactNode } from 'react'
import type { Square } from 'chess.js'
import { ChevronRightIcon, Trash2Icon } from 'lucide-react'
import { arrowMoveLabel, highlightMoves } from '../../../lib/chess'
import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CATEGORY_BY_VALUE,
  type AnnotationCategory,
  type AnnotationLineStyle,
  type BoardAnnotationArrow,
  type BoardAnnotationCircle,
} from '../../board/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Matches the brush colors ChessBoard draws with (COLOR_TO_BRUSH in ChessBoard.tsx) — used for the color-picker swatches
const COLOR_HEX: Record<string, string> = { G: '#15781B', R: '#882020', B: '#003088', Y: '#e68f00' }
// Lighter tints for on-dark legibility (WCAG AA against the ~10%-opacity pill bg) — used for the move-tag pill and its icon
const TEXT_COLOR_HEX: Record<string, string> = { G: '#34d399', R: '#fda4af', B: '#60a5fa', Y: '#fbbf24' }
const COLOR_ORDER = ['G', 'R', 'B', 'Y'] as const

// solid = concrete move, dashed = idea/plan, dotted = opponent threat.
const LINE_STYLES: { value: AnnotationLineStyle; label: string; dash: string }[] = [
  { value: 'solid', label: 'Solid — concrete move', dash: '' },
  { value: 'dashed', label: 'Dashed — idea / plan', dash: '4 2' },
  { value: 'dotted', label: 'Dotted — opponent threat', dash: '1 2' },
]

type Props = {
  fen: string
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  onArrowColorChange: (index: number, color: string) => void
  onCircleColorChange: (index: number, color: string) => void
  onArrowCategoryChange: (index: number, category: AnnotationCategory | null) => void
  onCircleCategoryChange: (index: number, category: AnnotationCategory | null) => void
  onArrowCommentChange: (index: number, comment: string | null) => void
  onCircleCommentChange: (index: number, comment: string | null) => void
  onArrowLineStyleChange: (index: number, lineStyle: AnnotationLineStyle) => void
  onCircleLineStyleChange: (index: number, lineStyle: AnnotationLineStyle) => void
  onArrowOrderChange: (index: number, order: number | null) => void
  onCircleFillChange: (index: number, fill: boolean) => void
  onArrowDelete: (index: number) => void
  onCircleDelete: (index: number) => void
}

export function AnnotationsList({
  fen,
  arrows,
  circles,
  onArrowColorChange,
  onCircleColorChange,
  onArrowCategoryChange,
  onCircleCategoryChange,
  onArrowCommentChange,
  onCircleCommentChange,
  onArrowLineStyleChange,
  onCircleLineStyleChange,
  onArrowOrderChange,
  onCircleFillChange,
  onArrowDelete,
  onCircleDelete,
}: Props) {
  const [open, setOpen] = useState(true)

  if (arrows.length === 0 && circles.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-xs border-0 text-muted-foreground uppercase tracking-wide"
          />
        }
      >
        <ChevronRightIcon data-icon="inline-start" className={cn('transition-transform', open && 'rotate-90')} />
        Annotations
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-2">
          {arrows.map((arrow, i) => (
            <AnnotationRow
              key={`arrow-${i}`}
              icon={<ArrowIcon color={arrow.color} />}
              label={arrowMoveLabel(fen, arrow.from_square as Square, arrow.to_square as Square)}
              color={arrow.color}
              category={arrow.category}
              comment={arrow.comment}
              lineStyle={arrow.line_style}
              order={arrow.order}
              onPickColor={(color) => onArrowColorChange(i, color)}
              onPickCategory={(category) => onArrowCategoryChange(i, category)}
              onCommentChange={(comment) => onArrowCommentChange(i, comment)}
              onPickLineStyle={(lineStyle) => onArrowLineStyleChange(i, lineStyle)}
              onOrderChange={(order) => onArrowOrderChange(i, order)}
              onDelete={() => onArrowDelete(i)}
            />
          ))}
          {circles.map((circle, i) => (
            <AnnotationRow
              key={`circle-${i}`}
              icon={<CircleIcon color={circle.color} />}
              label={circle.square}
              color={circle.color}
              category={circle.category}
              comment={circle.comment}
              lineStyle={circle.line_style}
              fill={circle.fill}
              onPickColor={(color) => onCircleColorChange(i, color)}
              onPickCategory={(category) => onCircleCategoryChange(i, category)}
              onCommentChange={(comment) => onCircleCommentChange(i, comment)}
              onPickLineStyle={(lineStyle) => onCircleLineStyleChange(i, lineStyle)}
              onFillChange={(fill) => onCircleFillChange(i, fill)}
              onDelete={() => onCircleDelete(i)}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

type AnnotationRowProps = {
  icon: ReactNode
  label: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
  lineStyle: AnnotationLineStyle
  onPickColor: (color: string) => void
  onPickCategory: (category: AnnotationCategory | null) => void
  onCommentChange: (comment: string | null) => void
  onPickLineStyle: (lineStyle: AnnotationLineStyle) => void
  // Arrow-only: step number in a multi-move plan.
  order?: number | null
  onOrderChange?: (order: number | null) => void
  // Circle-only: filled square wash instead of a ring.
  fill?: boolean
  onFillChange?: (fill: boolean) => void
  onDelete: () => void
}

function AnnotationRow({
  icon,
  label,
  color,
  category,
  comment,
  lineStyle,
  onPickColor,
  onPickCategory,
  onCommentChange,
  onPickLineStyle,
  order,
  onOrderChange,
  fill,
  onFillChange,
  onDelete,
}: AnnotationRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expanded, setExpanded] = useState(!!comment)
  const [editing, setEditing] = useState(!comment)
  const [draft, setDraft] = useState(comment ?? '')

  useEffect(() => {
    setDraft(comment ?? '')
    setExpanded(!!comment)
    setEditing(!comment)
  }, [comment])

  function commitComment() {
    const trimmed = draft.trim()
    if (trimmed !== (comment ?? '')) onCommentChange(trimmed || null)
    setEditing(!trimmed)
  }

  const rows = Math.min(8, Math.max(4, draft.split('\n').length))

  return (
    <li className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs font-medium"
                  style={{ backgroundColor: `${TEXT_COLOR_HEX[color] ?? color}1a`, color: TEXT_COLOR_HEX[color] ?? color }}
                />
              }
            >
              {icon}
              {label}
            </PopoverTrigger>
            <PopoverContent className="w-auto flex-row gap-1.5 p-1.5">
              {COLOR_ORDER.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onPickColor(c); setPickerOpen(false) }}
                  className="w-4 h-4 rounded-full border border-border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: COLOR_HEX[c] }}
                />
              ))}
            </PopoverContent>
          </Popover>
          <CategoryBadge category={category} onPickCategory={onPickCategory} />
          <LineStyleBadge lineStyle={lineStyle} onPickLineStyle={onPickLineStyle} />
          {onOrderChange && <OrderStepper order={order ?? null} onOrderChange={onOrderChange} />}
          {onFillChange && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn('text-xs', fill && 'bg-muted')}
              aria-label={fill ? 'Filled square' : 'Ring (click to fill square)'}
              aria-pressed={!!fill}
              onClick={() => onFillChange(!fill)}
            >
              <FillSquareIcon filled={!!fill} color={TEXT_COLOR_HEX[color] ?? color} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete annotation"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
            aria-expanded={expanded}
          >
            <ChevronRightIcon className={cn('transition-transform', expanded && 'rotate-90')} />
          </Button>
        </div>
      </div>
      {expanded && (
        editing ? (
          <Textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitComment}
            placeholder="Add a comment…"
            rows={rows}
            className="text-sm"
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="w-full text-foreground/80 text-sm rounded px-1.5 py-1 -mx-1.5 -my-1 whitespace-pre-wrap cursor-text hover:bg-muted transition-colors"
          >
            {highlightMoves(draft)}
          </div>
        )
      )}
    </li>
  )
}

function CategoryBadge({
  category,
  onPickCategory,
}: {
  category: AnnotationCategory | null
  onPickCategory: (category: AnnotationCategory | null) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = category ? ANNOTATION_CATEGORY_BY_VALUE[category] : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-xs"
            aria-label={meta ? `Category: ${meta.label}` : 'Set category'}
            style={meta ? { backgroundColor: `${meta.fill}1a`, color: meta.fill } : undefined}
          />
        }
      >
        {meta ? meta.glyph : <span className="text-muted-foreground">+</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto flex-col gap-0.5 p-1">
        {ANNOTATION_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => { onPickCategory(c.value); setOpen(false) }}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer hover:bg-muted transition-colors',
              category === c.value && 'bg-muted',
            )}
          >
            <span className="w-4 text-center" style={{ color: c.fill }}>{c.glyph}</span>
            {c.label}
          </button>
        ))}
        {category && (
          <button
            type="button"
            onClick={() => { onPickCategory(null); setOpen(false) }}
            className="flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer hover:bg-muted transition-colors text-muted-foreground"
          >
            <span className="w-4 text-center">–</span>
            None
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

function LineStyleBadge({
  lineStyle,
  onPickLineStyle,
}: {
  lineStyle: AnnotationLineStyle
  onPickLineStyle: (lineStyle: AnnotationLineStyle) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Line style: ${lineStyle}`} />}
      >
        <LineStyleIcon dash={LINE_STYLES.find(s => s.value === lineStyle)?.dash ?? ''} />
      </PopoverTrigger>
      <PopoverContent className="w-auto flex-col gap-0.5 p-1">
        {LINE_STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { onPickLineStyle(s.value); setOpen(false) }}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer hover:bg-muted transition-colors',
              lineStyle === s.value && 'bg-muted',
            )}
          >
            <LineStyleIcon dash={s.dash} />
            {s.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function LineStyleIcon({ dash }: { dash: string }) {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" className="flex-shrink-0">
      <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={dash || undefined} />
    </svg>
  )
}

function OrderStepper({
  order,
  onOrderChange,
}: {
  order: number | null
  onOrderChange: (order: number | null) => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-xs font-mono"
      aria-label={order != null ? `Plan step ${order} (click to clear)` : 'Set plan step number'}
      onClick={() => onOrderChange(order != null ? null : 1)}
      onContextMenu={(e) => {
        // Right-click bumps the step number instead of clearing it, so a multi-arrow plan can
        // be numbered without reopening this control for every arrow.
        if (order == null) return
        e.preventDefault()
        onOrderChange(order + 1)
      }}
    >
      {order != null ? `#${order}` : <span className="text-muted-foreground">#</span>}
    </Button>
  )
}

function FillSquareIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill={filled ? color : 'none'} fillOpacity={0.5} stroke={color} strokeWidth="2" />
    </svg>
  )
}

function ArrowIcon({ color }: { color: string }) {
  const hex = TEXT_COLOR_HEX[color] ?? color
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <line x1="3" y1="13" x2="12" y2="4" stroke={hex} strokeWidth="2" strokeLinecap="round" />
      <polygon points="12,4 7,5 11,9" fill={hex} />
    </svg>
  )
}

function CircleIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke={TEXT_COLOR_HEX[color] ?? color} strokeWidth="2" />
    </svg>
  )
}
