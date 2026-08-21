import { useState, type ReactNode } from 'react'
import type { Square } from 'chess.js'
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, Link2Icon, Trash2Icon, XIcon } from 'lucide-react'
import { arrowMoveLabel, highlightMoves } from '../../../lib/chess'
import {
  type AnnotationCategory,
  type AnnotationLinePatch,
  type AnnotationLineStyle,
  type BoardAnnotationArrow,
  type BoardAnnotationCircle,
} from '../../board/types'
import type { AnnotationsActions } from '../../../stores/board/slices/annotationsSlice'
import { useCommentEditor } from '../hooks/useCommentEditor'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { COLOR_HEX, COLOR_ORDER, TEXT_COLOR_HEX } from './annotationConstants'
import { ArrowIcon, CircleIcon, FillSquareIcon } from './AnnotationIcons'
import { CategoryBadge, LineStyleBadge, OrderStepper } from './AnnotationBadges'

// Chained plans (Nf6 -> Bg4 -> e3 -> Nc6): arrows sharing a line_id collapse into one row,
// ordered by the existing `order` field. Link/unlink work on raw indices (same as the rest
// of this file); bulk edits address a whole line by its line_id.
export type AnnotationActions = Pick<
  AnnotationsActions,
  | 'updateArrow'
  | 'updateCircle'
  | 'deleteArrow'
  | 'deleteCircle'
  | 'linkArrows'
  | 'unlinkArrow'
  | 'updateLine'
  | 'reorderLine'
  | 'deleteLine'
>

type Props = {
  fen: string
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  actions: AnnotationActions
}

type ArrowMember = { arrow: BoardAnnotationArrow; index: number }
type ArrowEntry =
  | { kind: 'solo'; arrow: BoardAnnotationArrow; index: number }
  | { kind: 'line'; lineId: string; members: ArrowMember[] }

// Groups arrows sharing a line_id into one entry (members ordered by `order`), preserving the
// position of each entry's first occurrence in the original list.
function groupArrowEntries(arrows: BoardAnnotationArrow[]): ArrowEntry[] {
  const entries: ArrowEntry[] = []
  const seenLines = new Set<string>()
  arrows.forEach((arrow, index) => {
    if (!arrow.line_id) {
      entries.push({ kind: 'solo', arrow, index })
      return
    }
    if (seenLines.has(arrow.line_id)) return
    seenLines.add(arrow.line_id)
    const members = arrows
      .map((a, i) => ({ arrow: a, index: i }))
      .filter((m) => m.arrow.line_id === arrow.line_id)
      .sort((a, b) => (a.arrow.order ?? 0) - (b.arrow.order ?? 0))
    entries.push({ kind: 'line', lineId: arrow.line_id, members })
  })
  return entries
}

export function AnnotationsList({ fen, arrows, circles, actions }: Props) {
  const [open, setOpen] = useState(true)
  // Index of the arrow (solo or a line's last member) currently armed to be chained to the
  // next arrow clicked. Null = no link in progress.
  const [linkFrom, setLinkFrom] = useState<number | null>(null)

  if (arrows.length === 0 && circles.length === 0) return null

  const arrowEntries = groupArrowEntries(arrows)

  function handleToggleLink(index: number, memberIndices: number[] = [index]) {
    if (linkFrom !== null && memberIndices.includes(linkFrom)) {
      setLinkFrom(null)
      return
    }
    if (linkFrom === null) {
      setLinkFrom(index)
      return
    }
    actions.linkArrows(linkFrom, index)
    setLinkFrom(null)
  }

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
          {arrowEntries.map((entry) =>
            entry.kind === 'solo' ? (
              <ArrowAnnotationRow
                key={`arrow-${entry.index}`}
                fen={fen}
                arrow={entry.arrow}
                onChange={(patch) => actions.updateArrow(entry.index, patch)}
                onDelete={() => actions.deleteArrow(entry.index)}
                linkPending={linkFrom === entry.index}
                onToggleLink={() => handleToggleLink(entry.index)}
              />
            ) : (
              <LineRow
                key={`line-${entry.lineId}`}
                fen={fen}
                lineId={entry.lineId}
                members={entry.members}
                linkPending={linkFrom !== null && entry.members.some((m) => m.index === linkFrom)}
                onToggleLink={() => handleToggleLink(entry.members[entry.members.length - 1].index, entry.members.map((m) => m.index))}
                onChange={(patch) => actions.updateLine(entry.lineId, patch)}
                onMove={(index, direction) => actions.reorderLine(entry.lineId, index, direction)}
                onUnlink={actions.unlinkArrow}
                onDelete={() => actions.deleteLine(entry.lineId)}
              />
            ),
          )}
          {circles.map((circle, i) => (
            <CircleAnnotationRow
              key={`circle-${i}`}
              circle={circle}
              onChange={(patch) => actions.updateCircle(i, patch)}
              onDelete={() => actions.deleteCircle(i)}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ArrowAnnotationRow({
  fen,
  arrow,
  onChange,
  onDelete,
  linkPending,
  onToggleLink,
}: {
  fen: string
  arrow: BoardAnnotationArrow
  onChange: (patch: Partial<BoardAnnotationArrow>) => void
  onDelete: () => void
  linkPending: boolean
  onToggleLink: () => void
}) {
  return (
    <AnnotationRowShell
      icon={<ArrowIcon color={arrow.color} />}
      label={arrowMoveLabel(fen, arrow.from_square as Square, arrow.to_square as Square)}
      color={arrow.color}
      category={arrow.category}
      comment={arrow.comment}
      lineStyle={arrow.line_style}
      onChange={onChange}
      onDelete={onDelete}
      extraControls={<OrderStepper order={arrow.order ?? null} onOrderChange={(order) => onChange({ order })} />}
      linkPending={linkPending}
      onToggleLink={onToggleLink}
    />
  )
}

function CircleAnnotationRow({
  circle,
  onChange,
  onDelete,
}: {
  circle: BoardAnnotationCircle
  onChange: (patch: Partial<BoardAnnotationCircle>) => void
  onDelete: () => void
}) {
  return (
    <AnnotationRowShell
      icon={<CircleIcon color={circle.color} />}
      label={circle.square}
      color={circle.color}
      category={circle.category}
      comment={circle.comment}
      lineStyle={circle.line_style}
      onChange={onChange}
      onDelete={onDelete}
      extraControls={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('text-xs', circle.fill && 'bg-muted')}
          aria-label={circle.fill ? 'Filled square' : 'Ring (click to fill square)'}
          aria-pressed={circle.fill}
          onClick={() => onChange({ fill: !circle.fill })}
        >
          <FillSquareIcon filled={circle.fill} color={TEXT_COLOR_HEX[circle.color] ?? circle.color} />
        </Button>
      }
    />
  )
}

type LineRowProps = {
  fen: string
  lineId: string
  members: ArrowMember[]
  linkPending: boolean
  onToggleLink: () => void
  onChange: (patch: AnnotationLinePatch) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onUnlink: (index: number) => void
  onDelete: () => void
}

// A chained plan: a sequence of arrows (Nf6 -> Bg4 -> e3 -> Nc6) collapsed into one row.
// Color/category/comment/line-style are edited once and apply to every member; each move
// keeps its own reorder (swap step with a neighbor) and unlink (pull it out solo) controls.
function LineRow({
  fen,
  members,
  linkPending,
  onToggleLink,
  onChange,
  onMove,
  onUnlink,
  onDelete,
}: LineRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const first = members[0].arrow
  const { expanded, setExpanded, editing, setEditing, draft, setDraft, commitComment, rows } = useCommentEditor(
    first.comment,
    (comment) => onChange({ comment }),
  )

  return (
    <li className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Line color" />}>
              <ArrowIcon color={first.color} />
            </PopoverTrigger>
            <PopoverContent className="w-auto flex-row gap-1.5 p-1.5">
              {COLOR_ORDER.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange({ color: c }); setPickerOpen(false) }}
                  className="w-4 h-4 rounded-full border border-border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: COLOR_HEX[c] }}
                />
              ))}
            </PopoverContent>
          </Popover>
          <CategoryBadge category={first.category} onPickCategory={(category) => onChange({ category })} />
          <LineStyleBadge lineStyle={first.line_style} onPickLineStyle={(lineStyle) => onChange({ line_style: lineStyle })} />
          {members.map((m, i) => (
            <span key={m.index} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground text-xs">&rarr;</span>}
              <span
                className="inline-flex items-center gap-0.5 font-mono text-xs font-medium rounded px-1"
                style={{ backgroundColor: `${TEXT_COLOR_HEX[first.color] ?? first.color}1a`, color: TEXT_COLOR_HEX[first.color] ?? first.color }}
              >
                {arrowMoveLabel(fen, m.arrow.from_square as Square, m.arrow.to_square as Square)}
                <span className="flex flex-col -my-1">
                  <button
                    type="button"
                    onClick={() => onMove(m.index, 'up')}
                    disabled={i === 0}
                    aria-label="Move step earlier"
                    className="disabled:opacity-20 hover:text-foreground cursor-pointer disabled:cursor-default"
                  >
                    <ChevronUpIcon size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(m.index, 'down')}
                    disabled={i === members.length - 1}
                    aria-label="Move step later"
                    className="disabled:opacity-20 hover:text-foreground cursor-pointer disabled:cursor-default"
                  >
                    <ChevronDownIcon size={10} />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => onUnlink(m.index)}
                  aria-label="Unlink this move from the plan"
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon size={10} />
                </button>
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleLink}
            aria-label={linkPending ? 'Chaining… click another arrow (or click again to cancel)' : 'Extend this plan'}
            aria-pressed={linkPending}
            className={cn('text-muted-foreground', linkPending && 'text-primary bg-muted')}
          >
            <Link2Icon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete plan"
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

type AnnotationRowShellProps = {
  icon: ReactNode
  label: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
  lineStyle: AnnotationLineStyle
  onChange: (patch: AnnotationLinePatch) => void
  onDelete: () => void
  // Extra controls slotted in after the line-style badge — order stepper for arrows, fill
  // toggle for circles. Kept out of this shell's props so it stays row-kind agnostic.
  extraControls?: ReactNode
  // Chain-into-a-plan control — arrow rows only.
  linkPending?: boolean
  onToggleLink?: () => void
}

// Shared chrome for one annotation row: color/category/line-style pickers, delete, and the
// collapsible comment editor. Row-kind-specific bits (order stepper, fill toggle, link/chain
// button) are passed in by the arrow/circle/line wrappers above instead of living here.
function AnnotationRowShell({
  icon,
  label,
  color,
  category,
  comment,
  lineStyle,
  onChange,
  onDelete,
  extraControls,
  linkPending,
  onToggleLink,
}: AnnotationRowShellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const { expanded, setExpanded, editing, setEditing, draft, setDraft, commitComment, rows } = useCommentEditor(
    comment,
    (comment) => onChange({ comment }),
  )

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
                  onClick={() => { onChange({ color: c }); setPickerOpen(false) }}
                  className="w-4 h-4 rounded-full border border-border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: COLOR_HEX[c] }}
                />
              ))}
            </PopoverContent>
          </Popover>
          <CategoryBadge category={category} onPickCategory={(category) => onChange({ category })} />
          <LineStyleBadge lineStyle={lineStyle} onPickLineStyle={(lineStyle) => onChange({ line_style: lineStyle })} />
          {extraControls}
        </div>
        <div className="flex items-center gap-0.5">
          {onToggleLink && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleLink}
              aria-label={linkPending ? 'Chaining… click another arrow (or click again to cancel)' : 'Chain into a plan'}
              aria-pressed={!!linkPending}
              className={cn('text-muted-foreground', linkPending && 'text-primary bg-muted')}
            >
              <Link2Icon />
            </Button>
          )}
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

