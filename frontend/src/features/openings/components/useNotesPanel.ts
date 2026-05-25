import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openingCommentsApi, positionCommentsApi } from '../api'
import { openingsKeys } from '../api/queryKeys'
import { useAuthSession } from '../../../hooks/useAuthSession'
import { useMutationWithInvalidation } from '../hooks/useMutationWithInvalidation'
import type { OpeningComment, PositionComment } from '../types'

type EditingState = { id: number; content: string; type: 'opening' | 'position' }

type UseNotesPanelProps = {
  openingId: number
  moveIndex: number | null
  fen: string | undefined
}

export function useNotesPanel({ openingId, moveIndex, fen }: UseNotesPanelProps) {
  const session = useAuthSession()
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

  const createOpening = useMutationWithInvalidation(
    (content: string) => openingCommentsApi.create(openingId, content),
    openingQK,
  )
  const updateOpening = useMutationWithInvalidation(
    ({ id, content }: { id: number; content: string }) => openingCommentsApi.update(id, content),
    openingQK,
  )
  const deleteOpening = useMutationWithInvalidation(
    (id: number) => openingCommentsApi.delete(id),
    openingQK,
  )

  const createPosition = useMutationWithInvalidation(
    (content: string) => {
      if (moveIndex === null || fen === undefined) return Promise.reject(new Error('No position selected'))
      return positionCommentsApi.create(openingId, moveIndex, fen, content)
    },
    positionQK,
  )
  const updatePosition = useMutationWithInvalidation(
    ({ id, content }: { id: number; content: string }) => positionCommentsApi.update(id, content),
    positionQK,
  )
  const deletePosition = useMutationWithInvalidation(
    (id: number) => positionCommentsApi.delete(id),
    positionQK,
  )

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
