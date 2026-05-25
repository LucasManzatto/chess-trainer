import { useMemo } from 'react'
import { useNotesPanel } from './useNotesPanel'

type Props = {
  openingId: number
  moveIndex: number | null
  fen: string | undefined
  moves: string[]
}

type EditingState = { id: number; content: string; type: 'opening' | 'position' }

function moveLabel(moves: string[], index: number): string {
  const num = Math.floor(index / 2) + 1
  return index % 2 === 0 ? `${num}. ${moves[index]}` : `${num}... ${moves[index]}`
}

function NoteCard({
  label,
  content,
  highlighted,
  editing,
  onEdit,
  onDelete,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  label: string
  content: string
  highlighted: boolean
  editing: boolean
  onEdit: () => void
  onDelete: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
}) {
  return (
    <div className={`group rounded-md border transition-colors ${
      highlighted
        ? 'border-amber-500/40 bg-amber-500/8'
        : 'border-white/5 bg-white/3'
    }`}>
      <div className={`px-2 py-1 text-[10px] font-mono rounded-t-md border-b ${
        highlighted
          ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
          : 'text-gray-600 border-white/5'
      }`}>
        {label}
      </div>
      {editing ? (
        <div className="p-2 space-y-1.5">
          <textarea
            value={content}
            onChange={e => onEditChange(e.target.value)}
            className="w-full bg-white/5 text-white text-xs rounded p-2 border border-white/10 focus:outline-none focus:border-amber-400/50 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={onEditSave} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Save</button>
            <button onClick={onEditCancel} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-1.5 px-2 py-1.5">
          <p className="flex-1 text-gray-300 text-xs leading-relaxed">{content}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-px">
            <button onClick={onEdit} className="text-gray-500 hover:text-gray-300 text-xs transition-colors" title="Edit">✏</button>
            <button onClick={onDelete} className="text-gray-500 hover:text-red-400 text-xs transition-colors" title="Delete">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function NotesPanel({ openingId, moveIndex, fen, moves }: Props) {
  const {
    session,
    draft,
    setDraft,
    editing,
    setEditing,
    openingComments,
    positionComments,
    canSaveToOpening,
    canSaveToMove,
    saveToOpening,
    saveToMove,
    submitEdit,
    deleteOpening,
    deletePosition,
  } = useNotesPanel({ openingId, moveIndex, fen })

  if (!session) return null

  const sortedPositionComments = useMemo(
    () => [...positionComments].sort((a, b) => a.move_index - b.move_index),
    [positionComments],
  )
  const hasAnyNotes = openingComments.length > 0 || positionComments.length > 0

  return (
    <div className="space-y-4">
      {hasAnyNotes ? (
        <div className="space-y-2">
          {openingComments.map(c => (
            <NoteCard
              key={`opening-${c.id}`}
              label="Opening"
              content={editing?.id === c.id && editing.type === 'opening' ? editing.content : c.content}
              highlighted={moveIndex === null}
              editing={editing?.id === c.id && editing.type === 'opening'}
              onEdit={() => setEditing({ id: c.id, content: c.content, type: 'opening' })}
              onDelete={() => deleteOpening(c.id)}
              onEditChange={v => setEditing((e: EditingState | null) => e ? { ...e, content: v } : e)}
              onEditSave={submitEdit}
              onEditCancel={() => setEditing(null)}
            />
          ))}

          {sortedPositionComments.map(c => (
            <NoteCard
              key={`position-${c.id}`}
              label={moveLabel(moves, c.move_index)}
              content={editing?.id === c.id && editing.type === 'position' ? editing.content : c.content}
              highlighted={c.move_index === moveIndex}
              editing={editing?.id === c.id && editing.type === 'position'}
              onEdit={() => setEditing({ id: c.id, content: c.content, type: 'position' })}
              onDelete={() => deletePosition(c.id)}
              onEditChange={v => setEditing((e: EditingState | null) => e ? { ...e, content: v } : e)}
              onEditSave={submitEdit}
              onEditCancel={() => setEditing(null)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-xs italic">No notes yet</p>
      )}

      <div className="space-y-2 pt-1 border-t border-white/10">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="w-full bg-white/5 text-white text-xs rounded-md p-2 border border-white/10 focus:outline-none focus:border-amber-400/50 resize-none placeholder-gray-600"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={saveToOpening}
            disabled={!canSaveToOpening}
            className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            Save to opening
          </button>
          <button
            onClick={saveToMove}
            disabled={!canSaveToMove}
            className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            Save to move
          </button>
        </div>
      </div>
    </div>
  )
}
