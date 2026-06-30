import { useState, useRef, useEffect } from 'react'

type Props = {
  name: string | null
  isSaving: boolean
  onSave: (name: string | null) => void
  placeholder?: string
  className?: string
}

export function PositionName({ name, isSaving, onSave, placeholder = 'Unnamed position', className }: Props) {
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
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={className ?? 'bg-transparent text-white/90 text-lg font-medium tracking-wide focus:outline-none border-b border-amber-400/50 text-center w-full'}
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={e => e.key === 'Enter' && startEdit()}
      className={className ?? `text-lg font-medium tracking-wide cursor-text select-none ${name ? 'text-white/60' : 'text-white/20 italic'}`}
    >
      {name ?? placeholder}
      {isSaving && <span className="ml-2 text-xs text-white/30">saving…</span>}
    </span>
  )
}
