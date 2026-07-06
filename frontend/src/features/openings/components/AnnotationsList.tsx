import { useEffect, useState, type ReactNode } from 'react'
import type { Square } from 'chess.js'
import { ChevronRightIcon } from 'lucide-react'
import { arrowMoveLabel, highlightMoves } from '../../../lib/chess'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'
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

type Props = {
  fen: string
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  onArrowColorChange: (index: number, color: string) => void
  onCircleColorChange: (index: number, color: string) => void
  onArrowCommentChange: (index: number, comment: string | null) => void
  onCircleCommentChange: (index: number, comment: string | null) => void
}

export function AnnotationsList({
  fen,
  arrows,
  circles,
  onArrowColorChange,
  onCircleColorChange,
  onArrowCommentChange,
  onCircleCommentChange,
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
            className="self-start text-xs text-muted-foreground uppercase tracking-wide"
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
              comment={arrow.comment}
              onPickColor={(color) => onArrowColorChange(i, color)}
              onCommentChange={(comment) => onArrowCommentChange(i, comment)}
            />
          ))}
          {circles.map((circle, i) => (
            <AnnotationRow
              key={`circle-${i}`}
              icon={<CircleIcon color={circle.color} />}
              label={circle.square}
              color={circle.color}
              comment={circle.comment}
              onPickColor={(color) => onCircleColorChange(i, color)}
              onCommentChange={(comment) => onCircleCommentChange(i, comment)}
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
  comment: string | null
  onPickColor: (color: string) => void
  onCommentChange: (comment: string | null) => void
}

function AnnotationRow({ icon, label, color, comment, onPickColor, onCommentChange }: AnnotationRowProps) {
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
