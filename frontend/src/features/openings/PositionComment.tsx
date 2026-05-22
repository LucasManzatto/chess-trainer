import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionCommentsApi } from './api'
import { useAuthSession } from './useAuthSession'
import type { PositionComment as PC } from './types'

type Props = {
  openingId: number
  moveIndex: number
  fen: string
}

type PopoverState =
  | { mode: 'closed' }
  | { mode: 'draft'; text: string }
  | { mode: 'editing'; id: number; text: string }

export function PositionComment({ openingId, moveIndex, fen }: Props) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const queryKey = ['position-comments', openingId]
  const [popover, setPopover] = useState<PopoverState>({ mode: 'closed' })

  const { data: allComments = [] } = useQuery<PC[]>({
    queryKey,
    queryFn: () => positionCommentsApi.list(openingId),
    enabled: !!session,
  })

  const thisComment = allComments.find(c => c.move_index === moveIndex) ?? null

  const createMutation = useMutation({
    mutationFn: (content: string) => positionCommentsApi.create(openingId, moveIndex, fen, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => positionCommentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => positionCommentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey }); setPopover({ mode: 'closed' }) },
  })

  if (!session) return null

  function handleIconClick() {
    if (popover.mode !== 'closed') {
      setPopover({ mode: 'closed' })
      return
    }
    if (thisComment) {
      setPopover({ mode: 'editing', id: thisComment.id, text: thisComment.content })
    } else {
      setPopover({ mode: 'draft', text: '' })
    }
  }

  function submitCreate() {
    if (popover.mode !== 'draft' || !popover.text.trim()) return
    createMutation.mutate(popover.text.trim())
    setPopover({ mode: 'closed' })
  }

  function submitEdit() {
    if (popover.mode !== 'editing' || !popover.text.trim()) return
    updateMutation.mutate({ id: popover.id, content: popover.text.trim() })
    setPopover({ mode: 'closed' })
  }

  const hasComment = !!thisComment

  return (
    <div className="relative">
      <button
        onClick={handleIconClick}
        className={`text-xs transition-colors ${hasComment ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
        title={hasComment ? 'View/edit note' : 'Add note'}
      >
        💬
      </button>

      {popover.mode !== 'closed' && (
        <div className="absolute right-0 top-5 z-10 w-48 bg-gray-900 border border-white/10 rounded shadow-lg p-2 space-y-1">
          {popover.mode === 'editing' ? (
            <>
              <textarea
                value={popover.text}
                onChange={e => setPopover({ ...popover, text: e.target.value })}
                className="w-full bg-white/5 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-1">
                <button onClick={submitEdit} className="text-xs text-amber-400 hover:text-amber-300">Save</button>
                <button onClick={() => deleteMutation.mutate(popover.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                <button onClick={() => setPopover({ mode: 'closed' })} className="text-xs text-gray-500 hover:text-gray-300 ml-auto">✕</button>
              </div>
            </>
          ) : (
            <>
              <textarea
                value={popover.text}
                onChange={e => setPopover({ ...popover, text: e.target.value })}
                placeholder="Add note for this move…"
                className="w-full bg-white/5 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none resize-none placeholder-gray-600"
                rows={3}
                autoFocus
              />
              <div className="flex gap-1">
                <button onClick={submitCreate} className="text-xs text-amber-400 hover:text-amber-300">Save</button>
                <button onClick={() => setPopover({ mode: 'closed' })} className="text-xs text-gray-500 hover:text-gray-300 ml-auto">✕</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
