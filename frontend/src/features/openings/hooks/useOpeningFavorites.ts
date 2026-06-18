import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userPositionsApi } from '../api'
import { positionsKeys } from '../api/queryKeys'
import type { Position } from '../types'

export function useUserPositions() {
  const qc = useQueryClient()
  const key = positionsKeys.userPositions()

  const { data: userPositions = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => userPositionsApi.list(signal),
  })

  const save = useMutation({
    mutationFn: (fen: string) => userPositionsApi.save(fen),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (fen: string) => userPositionsApi.remove(fen),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const isSaved = useCallback(
    (fen: string) => userPositions.some((p: Position) => p.fen === fen),
    [userPositions],
  )

  return { userPositions, isLoading, save, remove, isSaved }
}
