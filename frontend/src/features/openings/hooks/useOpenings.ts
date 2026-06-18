import { useQuery } from '@tanstack/react-query'
import { fetchPositions } from '../api'
import type { Position } from '../types'

export function useOpenings() {
  return useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity,
  })
}
