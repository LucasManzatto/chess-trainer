import { useMemo } from 'react'
import { useOpeningsStore } from '../../../../features/openings/store/openingsStore'

export function useFilteredOpenings(search: string) {
  const openings = useOpeningsStore(s => s.openings)

  return useMemo(() =>
    search
      ? openings.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
      : openings,
  [openings, search])
}
