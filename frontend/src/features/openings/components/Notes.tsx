import { useState } from 'react'

export type NotesProps = {
  comments: { id: number; content: string }[]
  isLoading: boolean
  onAdd: (content: string) => void
  addPending: boolean
}

export function Notes({ comments, isLoading, onAdd, addPending }: NotesProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <NotesHeader />
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 p-4">
        <NotesSection
          comments={comments}
          isLoading={isLoading}
          onAdd={onAdd}
          pending={addPending}
        />
      </div>
    </div>
  )
}

function NotesHeader() {
  return (
    <div className="px-4 h-11 flex items-center border-b border-white/[0.08] flex-shrink-0">
      <span
        className="text-white/80 font-semibold tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px' }}
      >
        Notes
      </span>
    </div>
  )
}

type NotesSectionProps = {
  comments: { id: number; content: string }[]
  isLoading: boolean
  onAdd: (content: string) => void
  pending: boolean
}

function NotesSection({ comments, isLoading, onAdd, pending }: NotesSectionProps) {
  const [draft, setDraft] = useState('')

  function handleAdd() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      {isLoading ? (
        <p className="text-sm text-white/25">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-white/25 italic">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {comments.map(c => (
            <li key={c.id} className="text-sm text-white/75 bg-white/[0.05] rounded-md px-3 py-2 leading-snug border border-white/[0.06]">
              {c.content}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-1.5">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="Add a note…"
          rows={2}
          className="w-full bg-white/[0.06] text-white/80 text-sm rounded-md px-3 py-2 resize-none placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/40 border border-white/[0.08] transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !draft.trim()}
          className="self-end text-xs px-3 py-1 rounded border border-amber-500/30 text-amber-300/80 hover:border-amber-400/60 hover:text-amber-200 disabled:opacity-30 transition-colors"
        >
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </div>
  )
}
