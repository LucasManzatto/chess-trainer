import { useState } from 'react'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'
import { AnnotationsList } from './AnnotationsList'

export type NotesProps = {
  fen: string
  comments: { id: number; content: string }[]
  onAdd: (content: string) => void
  addPending: boolean
  onRemove: (id: number) => void
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  onArrowColorChange: (index: number, color: string) => void
  onCircleColorChange: (index: number, color: string) => void
  onArrowCommentChange: (index: number, comment: string | null) => void
  onCircleCommentChange: (index: number, comment: string | null) => void
}

export function Notes({
  fen,
  comments,
  onAdd,
  addPending,
  onRemove,
  arrows,
  circles,
  onArrowColorChange,
  onCircleColorChange,
  onArrowCommentChange,
  onCircleCommentChange,
}: NotesProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      <NotesHeader />
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 p-3">
        <AnnotationsList
          fen={fen}
          arrows={arrows}
          circles={circles}
          onArrowColorChange={onArrowColorChange}
          onCircleColorChange={onCircleColorChange}
          onArrowCommentChange={onArrowCommentChange}
          onCircleCommentChange={onCircleCommentChange}
        />
        <NotesSection
          comments={comments}
          onRemove={onRemove}
        />
      </div>
      <AddNoteForm onAdd={onAdd} pending={addPending} />
    </div>
  )
}

function NotesHeader() {
  return (
    <div className="px-4 h-11 flex items-center border-b border-white/[0.08] flex-shrink-0">
      <span className="text-white/80 font-semibold tracking-tight text-sm">
        Notes
      </span>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M12.5 4.5 12 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L3.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type NotesSectionProps = {
  comments: { id: number; content: string }[]
  onRemove: (id: number) => void
}

function NotesSection({ comments, onRemove }: NotesSectionProps) {
  if (comments.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {comments.map(c => (
        <li key={c.id} className="group flex items-start justify-between gap-2 text-sm text-slate-300 bg-white/[0.05] rounded-lg p-3 leading-snug">
          <span>{c.content}</span>
          <button
            type="button"
            onClick={() => onRemove(c.id)}
            aria-label="Remove note"
            className="text-white/0 group-hover:text-white/40 hover:!text-red-400 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
          >
            <TrashIcon />
          </button>
        </li>
      ))}
    </ul>
  )
}

function AddNoteForm({ onAdd, pending }: { onAdd: (content: string) => void; pending: boolean }) {
  const [draft, setDraft] = useState('')

  function handleAdd() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  return (
    <div className="flex-shrink-0 p-3 pt-2.5 border-t border-white/[0.08] flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
        placeholder="Add a position note…"
        rows={2}
        className="w-full bg-white/[0.04] text-white/80 text-sm rounded-lg px-3 py-2 resize-none placeholder-white/25 focus:outline-none transition-colors"
      />
      <button
        onClick={handleAdd}
        disabled={pending || !draft.trim()}
        className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white text-xs font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer"
      >
        {pending ? 'Saving…' : 'Add note'}
      </button>
    </div>
  )
}
