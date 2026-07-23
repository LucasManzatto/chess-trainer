import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

type Props = {
  name: string | null
  openingName?: string | null
  isSaving: boolean
  onSave: (name: string | null) => void
  placeholder?: string
  className?: string
}

export function PositionName({
  name,
  openingName,
  isSaving,
  onSave,
  placeholder = 'Unnamed position',
  className,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(name ?? '')
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === (name ?? '')) return
    onSave(trimmed || null)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={className ?? 'h-auto rounded-none border-0 border-b border-amber-400/50 bg-transparent px-0 text-center text-lg font-medium tracking-wide text-white/90 focus-visible:ring-0'}
      />
    )
  }

  return (
    <span className="flex items-baseline gap-2 min-w-0">
      <span
        role="button"
        tabIndex={0}
        onClick={startEdit}
        onKeyDown={e => e.key === 'Enter' && startEdit()}
        className={className ?? `text-lg font-medium tracking-wide cursor-text select-none ${name ? 'text-white/60' : 'text-white/20 italic'}`}
      >
        {name ?? placeholder}
      </span>
      {openingName && (
        <span className="text-xs text-white/40 truncate select-none">{openingName}</span>
      )}
      {isSaving && <span className="text-xs text-muted-foreground">saving…</span>}
    </span>
  )
}
