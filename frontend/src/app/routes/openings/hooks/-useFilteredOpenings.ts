import { useMemo } from 'react'
import { useOpeningsStore } from '../../../../features/openings/store/openingsStore'

export function useFilteredOpenings(search: string) {
  const positions = useOpeningsStore(s => s.positions)

  return useMemo(() =>
    search
      ? positions.filter(o => (o.name ?? '').toLowerCase().includes(search.toLowerCase()))
      : positions,
  [positions, search])
}
