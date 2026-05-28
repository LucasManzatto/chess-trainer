import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { drillApi } from '../api'
import { openingsKeys } from '../api/queryKeys'
import type { DrillGrade } from '../types'

export function useDrill() {
  const qc = useQueryClient()
  const key = openingsKeys.drillQueue()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => drillApi.queue(signal),
  })

  const addToDrill = useMutation({
    mutationFn: (openingId: number) => drillApi.addToDrill(openingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const review = useMutation({
    mutationFn: ({ openingId, grade }: { openingId: number; grade: DrillGrade }) =>
      drillApi.review(openingId, grade),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { queue, isLoading, addToDrill, review }
}
