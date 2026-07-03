import { useState, type ReactNode } from 'react'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'

// Matches the brush colors ChessBoard draws with (COLOR_TO_BRUSH in ChessBoard.tsx) — used for the color-picker swatches
const COLOR_HEX: Record<string, string> = { G: '#15781B', R: '#882020', B: '#003088', Y: '#e68f00' }
// Lighter tints for on-dark legibility (WCAG AA against the ~10%-opacity pill bg) — used for the move-tag pill and its icon
const TEXT_COLOR_HEX: Record<string, string> = { G: '#34d399', R: '#fda4af', B: '#60a5fa', Y: '#fbbf24' }
const COLOR_ORDER = ['G', 'R', 'B', 'Y'] as const
const CARD_CLASS = 'bg-white/[0.05] rounded-lg p-3'

type Props = {
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  onArrowColorChange: (index: number, color: string) => void
  onCircleColorChange: (index: number, color: string) => void
  onArrowCommentChange: (index: number, comment: string | null) => void
  onCircleCommentChange: (index: number, comment: string | null) => void
}

export function AnnotationsList({
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-wide cursor-pointer hover:text-white/60 transition-colors"
      >
        <ChevronIcon open={open} />
        Annotations
      </button>
      {open && (
        <ul className="flex flex-col gap-2">
          {arrows.map((arrow, i) => (
            <AnnotationRow
              key={`arrow-${i}`}
              icon={<ArrowIcon color={arrow.color} />}
              label={`${arrow.from_square} → ${arrow.to_square}`}
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
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      className={`flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path d="M5 3l6 5-6 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const [expanded, setExpanded] = useState(true)
  const [draft, setDraft] = useState(comment ?? '')

  function commitComment() {
    const trimmed = draft.trim()
    if (trimmed === (comment ?? '')) return
    onCommentChange(trimmed || null)
  }

  return (
    <li className={`${CARD_CLASS} flex flex-col gap-2`}>
      <div className="relative flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPickerOpen(open => !open)}
          className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs font-medium cursor-pointer transition-colors"
          style={{ backgroundColor: `${TEXT_COLOR_HEX[color] ?? color}1a`, color: TEXT_COLOR_HEX[color] ?? color }}
        >
          {icon}
          {label}
        </button>
        {pickerOpen && (
          <ColorPicker
            onPick={(next) => { onPickColor(next); setPickerOpen(false) }}
          />
        )}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
          aria-expanded={expanded}
          className="text-white/30 hover:text-white/60 transition-colors cursor-pointer p-1"
        >
          <ChevronIcon open={expanded} />
        </button>
      </div>
      {expanded && (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitComment}
          placeholder="Add a comment…"
          rows={8}
          className="w-full bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.04] text-slate-300 text-sm rounded px-1.5 py-1 -mx-1.5 -my-1 resize-none placeholder-white/30 border border-dashed border-transparent hover:border-white/15 focus:border-white/20 focus:outline-none transition-colors"
        />
      )}
    </li>
  )
}

function ColorPicker({ onPick }: { onPick: (color: string) => void }) {
  return (
    <div className="absolute z-10 top-full mt-1 left-0 flex items-center gap-1.5 bg-neutral-900 border border-white/15 rounded-md px-2 py-1.5 shadow-lg">
      {COLOR_ORDER.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          className="w-4 h-4 rounded-full border border-white/20 cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: COLOR_HEX[color] }}
        />
      ))}
    </div>
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
