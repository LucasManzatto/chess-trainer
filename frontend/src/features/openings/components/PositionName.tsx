import { useState, useRef, useEffect } from 'react'
import { usePosition } from '../hooks/usePosition'
import { usePositionMoves } from '../hooks/usePositionMoves'
import type { PositionMoveCreateBody } from '../types'

type Props = {
  fen: string
  moves?: string[]
  lastMove?: PositionMoveCreateBody
  placeholder?: string
  className?: string
}

export function PositionName({ fen, moves, lastMove, placeholder = 'Unnamed position', className }: Props) {
  const { position, upsert } = usePosition(fen)
  const { create: createMove } = usePositionMoves(fen)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const displayName = position?.name ?? null
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(displayName ?? '')
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    const current = position?.name ?? null
    if (trimmed === (current ?? '')) return
    upsert.mutate({ name: trimmed || null, moves })
    if (lastMove) createMove.mutate(lastMove)
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
      className={className ?? `text-lg font-medium tracking-wide cursor-text select-none ${displayName ? 'text-white/60' : 'text-white/20 italic'}`}
    >
      {displayName ?? placeholder}
      {upsert.isPending && <span className="ml-2 text-xs text-white/30">saving…</span>}
    </span>
  )
}
