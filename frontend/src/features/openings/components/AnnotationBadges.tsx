import { useState } from 'react'
import { ANNOTATION_CATEGORIES, ANNOTATION_CATEGORY_BY_VALUE, type AnnotationCategory, type AnnotationLineStyle } from '../../board/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { LINE_STYLES } from './annotationConstants'
import { LineStyleIcon } from './AnnotationIcons'

export function CategoryBadge({
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
      <Tooltip>
        <TooltipTrigger
          render={
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
          }
        />
        <TooltipContent side="top">{meta ? `Category: ${meta.label}` : 'Set category'}</TooltipContent>
      </Tooltip>
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

export function LineStyleBadge({
  lineStyle,
  onPickLineStyle,
}: {
  lineStyle: AnnotationLineStyle
  onPickLineStyle: (lineStyle: AnnotationLineStyle) => void
}) {
  const [open, setOpen] = useState(false)
  const label = LINE_STYLES.find(s => s.value === lineStyle)?.label ?? lineStyle

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Line style: ${lineStyle}`} />}>
              <LineStyleIcon dash={LINE_STYLES.find(s => s.value === lineStyle)?.dash ?? ''} />
            </PopoverTrigger>
          }
        />
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
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

export function OrderStepper({
  order,
  onOrderChange,
}: {
  order: number | null
  onOrderChange: (order: number | null) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-xs font-mono"
            aria-label={order != null ? `Plan step ${order} (click to clear)` : 'Set plan step number'}
            onClick={() => onOrderChange(order != null ? null : 1)}
            onContextMenu={(e) => {
              // Right-click bumps the step number instead of clearing it, so a multi-arrow plan
              // can be numbered without reopening this control for every arrow.
              if (order == null) return
              e.preventDefault()
              onOrderChange(order + 1)
            }}
          />
        }
      >
        {order != null ? `#${order}` : <span className="text-muted-foreground">#</span>}
      </TooltipTrigger>
      <TooltipContent side="top">
        {order != null ? `Plan step ${order} — click to clear, right-click to bump` : 'Set plan step number'}
      </TooltipContent>
    </Tooltip>
  )
}
