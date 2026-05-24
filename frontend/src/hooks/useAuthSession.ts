import { useQuery } from '@tanstack/react-query'
import { authClient } from '../lib/auth'

export function useAuthSession() {
  const { data } = useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(),
    staleTime: 60_000,
  })
  return (data as { data: unknown } | undefined)?.data ?? null
}
