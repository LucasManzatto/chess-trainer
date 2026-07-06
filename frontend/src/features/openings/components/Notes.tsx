import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { highlightMoves } from '../../../lib/chess'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'
import { AnnotationsList } from './AnnotationsList'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="px-4 h-11 flex items-center border-b border-border flex-shrink-0">
      <span className="text-foreground/80 font-semibold tracking-tight text-sm">
        Notes
      </span>
    </div>
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
        <li key={c.id} className="group flex items-start justify-between gap-2 text-sm text-foreground/80 bg-muted/50 rounded-lg p-3 leading-snug">
          <span>{highlightMoves(c.content)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(c.id)}
            aria-label="Remove note"
            className="text-transparent group-hover:text-muted-foreground hover:!text-destructive flex-shrink-0"
          >
            <Trash2Icon />
          </Button>
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
    <div className="flex-shrink-0 p-3 pt-2.5 border-t border-border flex flex-col gap-2">
      <Textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
        placeholder="Add a position note…"
        rows={2}
      />
      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
        disabled={pending || !draft.trim()}
        className="self-end bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 dark:bg-amber-500/20 dark:hover:bg-amber-500/30"
      >
        {pending ? 'Saving…' : 'Add note'}
      </Button>
    </div>
  )
}
