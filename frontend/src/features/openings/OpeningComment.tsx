import { useState } from 'react'
import { useAuthSession } from './useAuthSession'
import { useOpeningComments } from './useOpeningComments'

type Props = { openingId: number }

export function OpeningComment({ openingId }: Props) {
  const session = useAuthSession()
  const { comments, createMutation, updateMutation, deleteMutation } = useOpeningComments(openingId)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: number; content: string } | null>(null)

  if (!session) return null

  function submitCreate() {
    if (!draft.trim()) return
    createMutation.mutate(draft.trim())
    setDraft('')
  }

  function submitEdit() {
    if (!editing || !editing.content.trim()) return
    updateMutation.mutate({ id: editing.id, content: editing.content.trim() })
    setEditing(null)
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Notes</div>

      {comments.map(c => (
        <div key={c.id} className="group text-sm">
          {editing?.id === c.id ? (
            <div className="space-y-1">
              <textarea
                value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                className="w-full bg-white/5 text-white text-xs rounded p-2 border border-white/10 focus:outline-none focus:border-amber-400/50 resize-none"
                rows={3}
              />
              <div className="flex gap-1">
                <button onClick={submitEdit} className="text-xs text-amber-400 hover:text-amber-300">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <p className="flex-1 text-gray-300 text-xs leading-relaxed">{c.content}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => setEditing({ id: c.id, content: c.content })}
                  className="text-gray-500 hover:text-gray-300 text-xs"
                  title="Edit"
                >✏</button>
                <button
                  onClick={() => deleteMutation.mutate(c.id)}
                  className="text-gray-500 hover:text-red-400 text-xs"
                  title="Delete"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="space-y-1">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="w-full bg-white/5 text-white text-xs rounded p-2 border border-white/10 focus:outline-none focus:border-amber-400/50 resize-none placeholder-gray-600"
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitCreate()
          }}
        />
        {draft.trim() && (
          <button onClick={submitCreate} className="text-xs text-amber-400 hover:text-amber-300">
            Save note
          </button>
        )}
      </div>
    </div>
  )
}
