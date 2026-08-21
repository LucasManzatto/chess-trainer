import { useState, type ReactNode } from 'react'
import type { Square } from 'chess.js'
import { DndContext, closestCenter, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRightIcon, GripVerticalIcon, Link2Icon, Trash2Icon, XIcon } from 'lucide-react'
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
import { arrowEntryKey, groupArrowEntries, type ArrowMember } from '../lib/annotationEntries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  | 'reorderLineMembers'
  | 'deleteLine'
  | 'reorderArrowEntries'
  | 'reorderCircles'
>

type Props = {
  fen: string
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  actions: AnnotationActions
  // Key (arrowEntryKey / circle square) of the annotation currently hovered — either a row here
  // or its shape on the board — so the matching row and shape can highlight together and
  // everything else dims. See ChessBoard's hoveredKey/onHoverEntry for the board side.
  hoveredKey?: string | null
  onHoverEntry?: (key: string | null) => void
}

// Sortable id for a line-member chip — prefixed so it can't collide with a row's arrowEntryKey
// (square notation / "line-<uuid>") inside the shared DndContext.
const memberId = (index: number) => `member-${index}`
const memberIndexFromId = (id: string) => Number(id.slice('member-'.length))

// Draggable id for a row's link/chain button — dragging it onto another row links them in one
// motion (the click-arm-then-click-target flow still works as a fallback, see handleToggleLink).
const linkSourceId = (rowId: string) => `linksrc-${rowId}`

export function AnnotationsList({ fen, arrows, circles, actions, hoveredKey, onHoverEntry }: Props) {
  const [open, setOpen] = useState(true)
  // Index of the arrow (solo or a line's last member) currently armed to be chained to the
  // next arrow clicked. Null = no link in progress.
  const [linkFrom, setLinkFrom] = useState<number | null>(null)
  // Pointer sensor only (no keyboard sensor) — reordering also isn't exposed via keyboard yet;
  // a small distance threshold keeps a plain click on the row (color picker, comment, etc.)
  // from being swallowed as a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  if (arrows.length === 0 && circles.length === 0) return null

  const arrowEntries = groupArrowEntries(arrows)
  const arrowEntryKeys = arrowEntries.map(arrowEntryKey)
  const circleKeys = circles.map((c) => c.square)

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

  // Single DndContext for the whole arrows/lines block: a LineRow's member chips get their own
  // nested SortableContext (supported), but nesting a second DndContext inside this one is not
  // — dnd-kit only reliably delivers drag events to the outermost context, so a nested
  // DndContext's onDragEnd never fires. Row/member/link-source drags are told apart here via
  // each draggable's `data.type` instead.
  function handleArrowDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const activeType = active.data.current?.type
    if (activeType === 'link-source') {
      // Dropping a row's link button onto another row chains them — same semantics as the
      // click-arm-then-click-target flow (linkIndex is each row's "index to link at": its own
      // index for a solo arrow, its last member's index for a line), just in one drag.
      if (over.data.current?.type !== 'row') return
      const fromIndex = active.data.current?.linkIndex as number
      const toIndex = over.data.current.linkIndex as number
      if (toIndex == null || fromIndex === toIndex) return
      actions.linkArrows(fromIndex, toIndex)
      return
    }
    if (activeType === 'member') {
      const lineId = active.data.current?.lineId as string
      if (over.data.current?.type !== 'member' || over.data.current.lineId !== lineId) return
      actions.reorderLineMembers(lineId, memberIndexFromId(String(active.id)), memberIndexFromId(String(over.id)))
      return
    }
    if (over.data.current?.type !== 'row') return
    actions.reorderArrowEntries(String(active.id), String(over.id))
  }

  function handleCircleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    actions.reorderCircles(String(active.id), String(over.id))
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleArrowDragEnd}>
            <SortableContext items={arrowEntryKeys} strategy={verticalListSortingStrategy}>
              {arrowEntries.map((entry) =>
                entry.kind === 'solo' ? (
                  <ArrowAnnotationRow
                    key={arrowEntryKey(entry)}
                    sortableId={arrowEntryKey(entry)}
                    linkIndex={entry.index}
                    fen={fen}
                    arrow={entry.arrow}
                    onChange={(patch) => actions.updateArrow(entry.index, patch)}
                    onDelete={() => actions.deleteArrow(entry.index)}
                    linkPending={linkFrom === entry.index}
                    onToggleLink={() => handleToggleLink(entry.index)}
                    hovered={hoveredKey === arrowEntryKey(entry)}
                    dimmed={hoveredKey != null && hoveredKey !== arrowEntryKey(entry)}
                    onHoverEntry={onHoverEntry}
                  />
                ) : (
                  <LineRow
                    key={arrowEntryKey(entry)}
                    sortableId={arrowEntryKey(entry)}
                    fen={fen}
                    lineId={entry.lineId}
                    members={entry.members}
                    linkPending={linkFrom !== null && entry.members.some((m) => m.index === linkFrom)}
                    onToggleLink={() => handleToggleLink(entry.members[entry.members.length - 1].index, entry.members.map((m) => m.index))}
                    onChange={(patch) => actions.updateLine(entry.lineId, patch)}
                    onUnlink={actions.unlinkArrow}
                    onDelete={() => actions.deleteLine(entry.lineId)}
                    hovered={hoveredKey === arrowEntryKey(entry)}
                    dimmed={hoveredKey != null && hoveredKey !== arrowEntryKey(entry)}
                    onHoverEntry={onHoverEntry}
                  />
                ),
              )}
            </SortableContext>
          </DndContext>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCircleDragEnd}>
            <SortableContext items={circleKeys} strategy={verticalListSortingStrategy}>
              {circles.map((circle, i) => (
                <CircleAnnotationRow
                  key={circle.square}
                  sortableId={circle.square}
                  circle={circle}
                  onChange={(patch) => actions.updateCircle(i, patch)}
                  onDelete={() => actions.deleteCircle(i)}
                  hovered={hoveredKey === circle.square}
                  dimmed={hoveredKey != null && hoveredKey !== circle.square}
                  onHoverEntry={onHoverEntry}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ArrowAnnotationRow({
  sortableId,
  linkIndex,
  fen,
  arrow,
  onChange,
  onDelete,
  linkPending,
  onToggleLink,
  hovered,
  dimmed,
  onHoverEntry,
}: {
  sortableId: string
  linkIndex: number
  fen: string
  arrow: BoardAnnotationArrow
  onChange: (patch: Partial<BoardAnnotationArrow>) => void
  onDelete: () => void
  linkPending: boolean
  onToggleLink: () => void
  hovered?: boolean
  dimmed?: boolean
  onHoverEntry?: (key: string | null) => void
}) {
  return (
    <AnnotationRowShell
      sortableId={sortableId}
      linkIndex={linkIndex}
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
      hovered={hovered}
      dimmed={dimmed}
      onHoverEntry={onHoverEntry}
    />
  )
}

function CircleAnnotationRow({
  sortableId,
  circle,
  onChange,
  onDelete,
  hovered,
  dimmed,
  onHoverEntry,
}: {
  sortableId: string
  circle: BoardAnnotationCircle
  onChange: (patch: Partial<BoardAnnotationCircle>) => void
  onDelete: () => void
  hovered?: boolean
  dimmed?: boolean
  onHoverEntry?: (key: string | null) => void
}) {
  return (
    <AnnotationRowShell
      sortableId={sortableId}
      icon={<CircleIcon color={circle.color} />}
      label={circle.square}
      color={circle.color}
      category={circle.category}
      comment={circle.comment}
      lineStyle={circle.line_style}
      onChange={onChange}
      onDelete={onDelete}
      hovered={hovered}
      dimmed={dimmed}
      onHoverEntry={onHoverEntry}
      extraControls={
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn('text-xs', circle.fill && 'bg-muted')}
                aria-label={circle.fill ? 'Filled square' : 'Ring (click to fill square)'}
                aria-pressed={circle.fill}
                onClick={() => onChange({ fill: !circle.fill })}
              />
            }
          >
            <FillSquareIcon filled={circle.fill} color={TEXT_COLOR_HEX[circle.color] ?? circle.color} />
          </TooltipTrigger>
          <TooltipContent side="top">{circle.fill ? 'Filled square — click for ring' : 'Ring — click to fill square'}</TooltipContent>
        </Tooltip>
      }
    />
  )
}

type LineRowProps = {
  sortableId: string
  fen: string
  lineId: string
  members: ArrowMember[]
  linkPending: boolean
  onToggleLink: () => void
  onChange: (patch: AnnotationLinePatch) => void
  onUnlink: (index: number) => void
  onDelete: () => void
  hovered?: boolean
  dimmed?: boolean
  onHoverEntry?: (key: string | null) => void
}

// A chained plan: a sequence of arrows (Nf6 -> Bg4 -> e3 -> Nc6) collapsed into one row.
// Color/category/comment/line-style are edited once and apply to every member; each move
// keeps its own reorder (swap step with a neighbor) and unlink (pull it out solo) controls.
function LineRow({
  sortableId,
  fen,
  lineId,
  members,
  linkPending,
  onToggleLink,
  onChange,
  onUnlink,
  onDelete,
  hovered,
  dimmed,
  onHoverEntry,
}: LineRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const first = members[0].arrow
  const { expanded, setExpanded, editing, setEditing, draft, setDraft, commitComment, rows } = useCommentEditor(
    first.comment,
    (comment) => onChange({ comment }),
  )
  // Extending a plan links onto its *last* member (matches the click-arm-then-click-target
  // flow's semantics) — used both as this row's drag-to-link target index and, below, as the
  // link button's own drag-source index.
  const linkIndex = members[members.length - 1].index
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    data: { type: 'row', linkIndex },
  })
  const {
    listeners: linkListeners,
    attributes: linkAttributes,
    setNodeRef: setLinkNodeRef,
    transform: linkTransform,
  } = useDraggable({ id: linkSourceId(sortableId), data: { type: 'link-source', linkIndex } })

  const rowColorHex = TEXT_COLOR_HEX[first.color] ?? first.color

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...(hovered ? { boxShadow: `0 0 0 1.5px ${rowColorHex}` } : undefined),
      }}
      onMouseEnter={() => onHoverEntry?.(sortableId)}
      onMouseLeave={() => onHoverEntry?.(null)}
      className={cn(
        'flex flex-col gap-2 bg-muted/50 rounded-lg p-3 transition-[opacity,box-shadow]',
        isDragging && 'opacity-50 z-10',
        dimmed && !isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  aria-label="Drag to reorder"
                  className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
                />
              }
            >
              <GripVerticalIcon size={14} />
            </TooltipTrigger>
            <TooltipContent side="top">Drag to reorder</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-4" />
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Line color" />}>
                    <ArrowIcon color={first.color} />
                  </PopoverTrigger>
                }
              />
              <TooltipContent side="top">Line color</TooltipContent>
            </Tooltip>
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
          {/* Nested SortableContext, not a nested DndContext — reordering is dispatched by the
              shared DndContext in AnnotationsList (see handleArrowDragEnd's data.type check). */}
          <SortableContext items={members.map((m) => memberId(m.index))} strategy={horizontalListSortingStrategy}>
            {members.map((m, i) => (
              <LineMemberChip
                key={m.index}
                member={m}
                lineId={lineId}
                showArrowPrefix={i > 0}
                colorHex={TEXT_COLOR_HEX[first.color] ?? first.color}
                fen={fen}
                onUnlink={() => onUnlink(m.index)}
              />
            ))}
          </SortableContext>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  {...linkListeners}
                  {...linkAttributes}
                  ref={setLinkNodeRef}
                  onClick={onToggleLink}
                  aria-label={linkPending ? 'Chaining… click another arrow (or click again to cancel)' : 'Extend this plan'}
                  aria-pressed={linkPending}
                  className={cn(
                    'text-muted-foreground cursor-grab active:cursor-grabbing touch-none',
                    linkPending && 'text-primary bg-muted',
                  )}
                  style={{ transform: CSS.Translate.toString(linkTransform) }}
                />
              }
            >
              <Link2Icon />
            </TooltipTrigger>
            <TooltipContent side="top">Drag onto another arrow to link, or click to arm/cancel</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpanded(e => !e)}
                  aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
                  aria-expanded={expanded}
                />
              }
            >
              <ChevronRightIcon className={cn('transition-transform', expanded && 'rotate-90')} />
            </TooltipTrigger>
            <TooltipContent side="top">{expanded ? 'Collapse comment' : 'Expand comment'}</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-4" />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  aria-label="Delete plan"
                  className="text-muted-foreground hover:text-destructive"
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent side="top">Delete plan</TooltipContent>
          </Tooltip>
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

// One step's chip inside a LineRow, draggable to reorder its position among the plan's other
// steps. Drag listeners sit on the pill itself (there's no room for a separate handle at this
// size); the unlink button stops pointerdown propagation so a plain click still unlinks
// instead of being swallowed as a drag start.
function LineMemberChip({
  member,
  lineId,
  showArrowPrefix,
  colorHex,
  fen,
  onUnlink,
}: {
  member: ArrowMember
  lineId: string
  showArrowPrefix: boolean
  colorHex: string
  fen: string
  onUnlink: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: memberId(member.index),
    data: { type: 'member', lineId },
  })

  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-1', isDragging && 'opacity-50 z-10')}
    >
      {showArrowPrefix && <span className="text-muted-foreground text-xs">&rarr;</span>}
      <span
        {...attributes}
        {...listeners}
        className="inline-flex items-center gap-0.5 font-mono text-xs font-medium rounded px-1 cursor-grab active:cursor-grabbing touch-none"
        style={{ backgroundColor: `${colorHex}1a`, color: colorHex }}
      >
        {arrowMoveLabel(fen, member.arrow.from_square as Square, member.arrow.to_square as Square)}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onUnlink}
          aria-label="Unlink this move from the plan"
          className="hover:text-destructive cursor-pointer"
        >
          <XIcon size={10} />
        </button>
      </span>
    </span>
  )
}

type AnnotationRowShellProps = {
  sortableId: string
  // This row's "index to link at" — its own draftArrows index. Doubles as the drag-to-link
  // drop-target index (when another row is dropped here) and drag-source index (when this
  // row's own link button is dragged). Circle rows don't link, so it's omitted for them.
  linkIndex?: number
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
  // Hover-linkage with the matching shape on the board (see Props.hoveredKey/onHoverEntry).
  hovered?: boolean
  dimmed?: boolean
  onHoverEntry?: (key: string | null) => void
}

// Shared chrome for one annotation row: drag handle, color/category/line-style pickers,
// delete, and the collapsible comment editor. Row-kind-specific bits (order stepper, fill
// toggle, link/chain button) are passed in by the arrow/circle/line wrappers above instead of
// living here.
function AnnotationRowShell({
  sortableId,
  linkIndex,
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
  hovered,
  dimmed,
  onHoverEntry,
}: AnnotationRowShellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const { expanded, setExpanded, editing, setEditing, draft, setDraft, commitComment, rows } = useCommentEditor(
    comment,
    (comment) => onChange({ comment }),
  )
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    data: { type: 'row', linkIndex },
  })
  const {
    listeners: linkListeners,
    attributes: linkAttributes,
    setNodeRef: setLinkNodeRef,
    transform: linkTransform,
  } = useDraggable({ id: linkSourceId(sortableId), data: { type: 'link-source', linkIndex } })

  const rowColorHex = TEXT_COLOR_HEX[color] ?? color

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...(hovered ? { boxShadow: `0 0 0 1.5px ${rowColorHex}` } : undefined),
      }}
      onMouseEnter={() => onHoverEntry?.(sortableId)}
      onMouseLeave={() => onHoverEntry?.(null)}
      className={cn(
        'flex flex-col gap-2 bg-muted/50 rounded-lg p-3 transition-[opacity,box-shadow]',
        isDragging && 'opacity-50 z-10',
        dimmed && !isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  aria-label="Drag to reorder"
                  className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
                />
              }
            >
              <GripVerticalIcon size={14} />
            </TooltipTrigger>
            <TooltipContent side="top">Drag to reorder</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-4" />
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs font-medium"
                  style={{ backgroundColor: `${rowColorHex}1a`, color: rowColorHex }}
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
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    {...linkListeners}
                    {...linkAttributes}
                    ref={setLinkNodeRef}
                    onClick={onToggleLink}
                    aria-label={linkPending ? 'Chaining… click another arrow (or click again to cancel)' : 'Chain into a plan'}
                    aria-pressed={!!linkPending}
                    className={cn(
                      'text-muted-foreground cursor-grab active:cursor-grabbing touch-none',
                      linkPending && 'text-primary bg-muted',
                    )}
                    style={{ transform: CSS.Translate.toString(linkTransform) }}
                  />
                }
              >
                <Link2Icon />
              </TooltipTrigger>
              <TooltipContent side="top">Drag onto another arrow to link, or click to arm/cancel</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpanded(e => !e)}
                  aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
                  aria-expanded={expanded}
                />
              }
            >
              <ChevronRightIcon className={cn('transition-transform', expanded && 'rotate-90')} />
            </TooltipTrigger>
            <TooltipContent side="top">{expanded ? 'Collapse comment' : 'Expand comment'}</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-4" />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  aria-label="Delete annotation"
                  className="text-muted-foreground hover:text-destructive"
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent side="top">Delete annotation</TooltipContent>
          </Tooltip>
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

