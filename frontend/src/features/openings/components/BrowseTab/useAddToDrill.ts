import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthSession } from '../../hooks/useAuthSession'
import { drillApi } from '../../api'

export function useAddToDrill(openingId: number) {
  const session = useAuthSession()
  const qc = useQueryClient()

  const { data: queue = [] } = useQuery({
    queryKey: ['drill-queue'],
    queryFn: drillApi.queue,
    enabled: !!session,
  })

  const mutation = useMutation({
    mutationFn: () => drillApi.addToDrill(openingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drill-queue'] }),
  })

  const inDrill = (queue as Array<{ opening_id: number }>).some(i => i.opening_id === openingId)

  return {
    isLoggedIn: !!session,
    inDrill,
    add: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
