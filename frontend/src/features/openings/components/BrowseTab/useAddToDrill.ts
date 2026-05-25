import { useQuery } from '@tanstack/react-query'
import { useAuthSession } from '../../../../hooks/useAuthSession'
import { useMutationWithInvalidation } from '../../hooks/useMutationWithInvalidation'
import { drillApi } from '../../api'
import { openingsKeys } from '../../api/queryKeys'

export function useAddToDrill(openingId: number) {
  const session = useAuthSession()

  const { data: queue = [] } = useQuery({
    queryKey: openingsKeys.drillQueue(),
    queryFn: ({ signal }) => drillApi.queue(signal),
    enabled: !!session,
  })

  const mutation = useMutationWithInvalidation<void>(
    () => drillApi.addToDrill(openingId),
    openingsKeys.drillQueue(),
  )

  const inDrill = queue.some(i => i.opening_id === openingId)

  return {
    isLoggedIn: !!session,
    inDrill,
    add: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
