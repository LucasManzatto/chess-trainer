import { useState } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { highlightMoves } from '../../../lib/chess'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'
import { AnnotationsList, type AnnotationActions } from './AnnotationsList'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export type LastMove = { label: string; comment: string | null }

export type NotesProps = {
  fen: string
  comments: { id: number; content: string }[]
  onAdd: (content: string) => void
  onUpdate: (id: number, content: string) => void
  arrows: BoardAnnotationArrow[]
  circles: BoardAnnotationCircle[]
  lastMove: LastMove | null
  lastNotes: { id: number; content: string }[]
  annotationActions: AnnotationActions
  hoveredAnnotationKey?: string | null
  onHoverAnnotation?: (key: string | null) => void
}

export function Notes({
  fen,
  comments,
  onAdd,
  onUpdate,
  arrows,
  circles,
  lastMove,
  lastNotes,
  annotationActions,
  hoveredAnnotationKey,
  onHoverAnnotation,
}: NotesProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      <NotesHeader />
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 p-3">
        <NotesSection comments={comments} onAdd={onAdd} onUpdate={onUpdate} />
        {lastNotes.length > 0 && <LastNotes comments={lastNotes} />}
        {lastMove && (
            <LastMoveAnnotations label={lastMove.label} comment={lastMove.comment} />
        )}
        <AnnotationsList
          fen={fen}
          arrows={arrows}
          circles={circles}
          actions={annotationActions}
          hoveredKey={hoveredAnnotationKey}
          onHoverEntry={onHoverAnnotation}
        />
      </div>
    </div>
  )
}

function LastMoveAnnotations({ label, comment }: { label: string; comment: string | null }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-muted/50 text-xs">
      <div className="flex items-center gap-1.5 font-mono font-medium text-white/70">
        <span className="uppercase tracking-wide text-[10px] text-muted-foreground">Last move</span>
        {highlightMoves(label)}
      </div>
      {comment && (
        <div className="text-foreground/80 whitespace-pre-wrap">{highlightMoves(comment)}</div>
      )}
    </div>
  )
}

function LastNotes({ comments }: { comments: { id: number; content: string }[] }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-muted/50 text-xs">
      <span className="uppercase tracking-wide text-[10px] text-muted-foreground">Previous notes</span>
      {comments.map(c => (
        <div key={c.id} className="text-foreground/80 whitespace-pre-wrap">
          {highlightMoves(c.content)}
        </div>
      ))}
    </div>
  )
}

function NotesHeader() {
  return (
    <div className="px-4 h-11 flex items-center border-white/[0.08] flex-shrink-0">
      <span className="text-white/80 font-semibold tracking-tight text-sm">
        Notes
      </span>
    </div>
  )
}

type NotesSectionProps = {
  comments: { id: number; content: string }[]
  onAdd: (content: string) => void
  onUpdate: (id: number, content: string) => void
}

function NotesSection({ comments, onAdd, onUpdate }: NotesSectionProps) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="self-start border-0 text-xs text-muted-foreground uppercase tracking-wide"
          />
        }
      >
        <ChevronRightIcon data-icon="inline-start" className={cn('transition-transform', open && 'rotate-90')} />
        Notes
      </CollapsibleTrigger>
      <CollapsibleContent>
        {comments.length === 0 ? (
          <NewNoteItem onSave={onAdd} />
        ) : (
          <ul className="flex flex-col gap-2">
            {comments.map(c => (
              <NoteItem
                key={`${c.id}:${c.content}`}
                content={c.content}
                onSave={content => onUpdate(c.id, content)}
              />
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function NewNoteItem({ onSave }: { onSave: (content: string) => void }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) {
      onSave(trimmed)
      setDraft('')
    }
  }

  return (
    <Textarea
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      placeholder="Add a note…"
      rows={2}
      className="text-sm bg-muted/50"
    />
  )
}

function NoteItem({
  content,
  onSave,
}: {
  content: string
  onSave: (content: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== content) onSave(trimmed)
    setEditing(false)
  }

  const rows = Math.min(8, Math.max(2, draft.split('\n').length))

  return (
    <li className="bg-muted/50 rounded-lg p-3">
      {editing ? (
        <Textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          rows={rows}
          className="text-sm"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-foreground/80 text-sm rounded px-1.5 py-1 -mx-1.5 -my-1 whitespace-pre-wrap cursor-text hover:bg-muted transition-colors"
        >
          {highlightMoves(draft)}
        </div>
      )}
    </li>
  )
}
