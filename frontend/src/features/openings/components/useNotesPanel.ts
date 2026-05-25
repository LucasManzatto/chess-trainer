import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingCommentsApi, positionCommentsApi } from '../api'
import { openingsKeys } from '../api/queryKeys'
import { useAuthSession } from '../../../hooks/useAuthSession'
import type { OpeningComment, PositionComment } from '../types'

type EditingState = { id: number; content: string; type: 'opening' | 'position' }

type UseNotesPanelProps = {
  openingId: number
  moveIndex: number | null
  fen: string | undefined
}

export function useNotesPanel({ openingId, moveIndex, fen }: UseNotesPanelProps) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<EditingState | null>(null)

  const openingQK = openingsKeys.comments(openingId)
  const positionQK = openingsKeys.positionComments(openingId)

  const { data: openingComments = [] } = useQuery<OpeningComment[]>({
    queryKey: openingQK,
    queryFn: ({ signal }) => openingCommentsApi.list(openingId, signal),
    enabled: !!session,
  })

  const { data: positionComments = [] } = useQuery<PositionComment[]>({
    queryKey: positionQK,
    queryFn: ({ signal }) => positionCommentsApi.list(openingId, signal),
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
    mutationFn: (content: string) => {
      if (moveIndex === null || fen === undefined) return Promise.reject(new Error('No position selected'))
      return positionCommentsApi.create(openingId, moveIndex, fen, content)
    },
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

  return {
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
    deleteOpening: deleteOpening.mutate,
    deletePosition: deletePosition.mutate,
  }
}
