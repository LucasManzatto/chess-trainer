import { useState } from 'react'
import { useOpeningComments } from '../hooks/useOpeningComments'
import { usePositionComments } from '../hooks/usePositionComments'
import type { OpeningComment, PositionComment, Opening } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotesProps = {
  selectedOpening: Opening | null
  currentMoveIndex: number
  currentFen: string | null
}

type NotesSectionProps = {
  title: string
  comments: OpeningComment[] | PositionComment[]
  isLoading: boolean
  onAdd: (content: string) => void
  pending: boolean
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Notes({ selectedOpening, currentMoveIndex, currentFen }: NotesProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <NotesHeader />
      {!selectedOpening ? (
        <p className="px-3 py-4 text-xs text-gray-600">No opening selected.</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 p-3">
          <OpeningNotesSection openingId={selectedOpening.id} />
          {currentMoveIndex >= 0 && currentFen !== null && (
            <MoveNotesSection
              openingId={selectedOpening.id}
              moveIndex={currentMoveIndex}
              fen={currentFen}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function NotesHeader() {
  return (
    <div className="px-3 h-10 flex items-center border-b border-white/[0.06] flex-shrink-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</span>
    </div>
  )
}

function OpeningNotesSection({ openingId }: { openingId: number }) {
  const { comments, isLoading, add } = useOpeningComments(openingId)

  return (
    <NotesSection
      title="Opening"
      comments={comments}
      isLoading={isLoading}
      onAdd={(content) => add.mutate(content)}
      pending={add.isPending}
    />
  )
}

function MoveNotesSection({ openingId, moveIndex, fen }: { openingId: number; moveIndex: number; fen: string }) {
  const { comments, isLoading, add } = usePositionComments(openingId, fen)

  return (
    <NotesSection
      title={`Move ${moveIndex + 1}`}
      comments={comments}
      isLoading={isLoading}
      onAdd={(content) => add.mutate({ moveIndex, content })}
      pending={add.isPending}
    />
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function NotesSection({ title, comments, isLoading, onAdd, pending }: NotesSectionProps) {
  const [draft, setDraft] = useState('')

  function handleAdd() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
      {isLoading ? (
        <p className="text-xs text-gray-600">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-600">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {comments.map(c => (
            <li key={c.id} className="text-sm text-gray-300 bg-white/[0.03] rounded px-2 py-1.5">
              {c.content}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-1">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="Add a note…"
          rows={2}
          className="w-full bg-white/[0.05] text-gray-200 text-xs rounded px-2 py-1.5 resize-none placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !draft.trim()}
          className="self-end text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
        >
          {pending ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  )
}
