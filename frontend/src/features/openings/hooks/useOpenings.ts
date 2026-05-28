import { useQuery } from '@tanstack/react-query'
import { fetchOpenings } from '../api'
import type { Opening } from '../types'

export function useOpenings() {
  return useQuery<Opening[]>({
    queryKey: ['openings'],
    queryFn: fetchOpenings,
    staleTime: Infinity,
  })
}
