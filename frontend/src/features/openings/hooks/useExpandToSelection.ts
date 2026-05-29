import { useEffect } from 'react'
import type { Opening } from '../types'

export function useExpandToSelection(
  selectedOpening: Opening | null,
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>,
  getPaths: (opening: Opening) => string[],
) {
  useEffect(() => {
    if (!selectedOpening) return
    const paths = getPaths(selectedOpening)
    setExpanded(prev => {
      if (paths.every(p => prev.has(p))) return prev
      const next = new Set(prev)
      for (const p of paths) next.add(p)
      return next
    })
  }, [selectedOpening, getPaths, setExpanded])
}
