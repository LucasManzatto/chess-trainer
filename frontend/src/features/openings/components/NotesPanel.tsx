import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingCommentsApi, positionCommentsApi } from '../api'
import { useAuthSession } from '../hooks/useAuthSession'
import type { OpeningComment, PositionComment } from '../types'

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

export function NotesPanel({ openingId, moveIndex, fen, moves }: Props) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<EditingState | null>(null)

  const openingQK = ['opening-comments', openingId]
  const positionQK = ['position-comments', openingId]

  const { data: openingComments = [] } = useQuery<OpeningComment[]>({
    queryKey: openingQK,
    queryFn: () => openingCommentsApi.list(openingId),
    enabled: !!session,
  })

  const { data: positionComments = [] } = useQuery<PositionComment[]>({
    queryKey: positionQK,
    queryFn: () => positionCommentsApi.list(openingId),
    enabled: !!session,
  })

  const createOpening = useMutation({
    mutationFn: (content: string) => openingCommentsApi.create(openingId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: openingQK }),
  })
  const updateOpening = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => openingCommentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: openingQK }),
  })
  const deleteOpening = useMutation({
    mutationFn: (id: number) => openingCommentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: openingQK }),
  })

  const createPosition = useMutation({
    mutationFn: (content: string) => positionCommentsApi.create(openingId, moveIndex!, fen!, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: positionQK }),
  })
  const updatePosition = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => positionCommentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: positionQK }),
  })
  const deletePosition = useMutation({
    mutationFn: (id: number) => positionCommentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: positionQK }),
  })

  if (!session) return null

  const currentMoveComment =
    moveIndex !== null ? (positionComments.find(c => c.move_index === moveIndex) ?? null) : null

  const canSaveToOpening = draft.trim().length > 0
  const canSaveToMove = draft.trim().length > 0 && moveIndex !== null && fen !== undefined

  function saveToOpening() {
    if (!canSaveToOpening) return
    createOpening.mutate(draft.trim())
    setDraft('')
  }

  function saveToMove() {
    if (!canSaveToMove) return
    createPosition.mutate(draft.trim())
    setDraft('')
  }

  function submitEdit() {
    if (!editing || !editing.content.trim()) return
    if (editing.type === 'opening') {
      updateOpening.mutate({ id: editing.id, content: editing.content.trim() })
    } else {
      updatePosition.mutate({ id: editing.id, content: editing.content.trim() })
    }
    setEditing(null)
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Opening Notes</div>

      {openingComments.map(c => (
        <div key={c.id} className="group text-sm">
          {editing?.id === c.id && editing.type === 'opening' ? (
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
                  onClick={() => setEditing({ id: c.id, content: c.content, type: 'opening' })}
                  className="text-gray-500 hover:text-gray-300 text-xs"
                  title="Edit"
                >✏</button>
                <button
                  onClick={() => deleteOpening.mutate(c.id)}
                  className="text-gray-500 hover:text-red-400 text-xs"
                  title="Delete"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {moveIndex !== null && (
        <div className="space-y-1 pt-2 border-t border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Move: {moveLabel(moves, moveIndex)}
          </div>
          {currentMoveComment ? (
            <div className="group text-sm">
              {editing?.id === currentMoveComment.id && editing.type === 'position' ? (
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
                  <p className="flex-1 text-gray-300 text-xs leading-relaxed">{currentMoveComment.content}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditing({ id: currentMoveComment.id, content: currentMoveComment.content, type: 'position' })}
                      className="text-gray-500 hover:text-gray-300 text-xs"
                      title="Edit"
                    >✏</button>
                    <button
                      onClick={() => deletePosition.mutate(currentMoveComment.id)}
                      className="text-gray-500 hover:text-red-400 text-xs"
                      title="Delete"
                    >✕</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-xs">No note for this move</p>
          )}
        </div>
      )}

      <div className="space-y-1 pt-2 border-t border-white/10">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="w-full bg-white/5 text-white text-xs rounded p-2 border border-white/10 focus:outline-none focus:border-amber-400/50 resize-none placeholder-gray-600"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={saveToOpening}
            disabled={!canSaveToOpening}
            className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:cursor-default"
          >
            Save to opening
          </button>
          <button
            onClick={saveToMove}
            disabled={!canSaveToMove}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-default"
          >
            Save to move
          </button>
        </div>
      </div>
    </div>
  )
}
