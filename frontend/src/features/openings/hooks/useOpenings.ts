import { useQuery } from '@tanstack/react-query'

export type Opening = {
  id: number
  eco: string
  name: string
  pgn: string
  fen: string
  moves: string[]
}

async function fetchOpenings(): Promise<Opening[]> {
  const resp = await fetch('/openings.json')
  if (!resp.ok) throw new Error('Failed to load openings')
  return resp.json()
}

export function useOpenings() {
  return useQuery<Opening[]>({
    queryKey: ['openings'],
    queryFn: fetchOpenings,
    staleTime: Infinity,
  })
}
