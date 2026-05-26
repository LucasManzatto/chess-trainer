import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthSession } from '../../../hooks/useAuthSession'
import { drillApi } from '../api'
import { openingsKeys } from '../api/queryKeys'
import type { DrillGrade } from '../types'

export function useDrillQueue() {
  const isLoggedIn = !!useAuthSession()
  const qc = useQueryClient()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: openingsKeys.drillQueue(),
    queryFn: ({ signal }) => drillApi.queue(signal),
    enabled: isLoggedIn,
  })

  const { mutate: submitGrade } = useMutation({
    mutationFn: ({ openingId, grade }: { openingId: number; grade: DrillGrade }) =>
      drillApi.review(openingId, grade),
    onSuccess: () => qc.invalidateQueries({ queryKey: openingsKeys.drillQueue() }),
  })

  return { isLoggedIn, queue, isLoading, submitGrade }
}
