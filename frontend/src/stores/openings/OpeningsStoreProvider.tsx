import { useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPositions } from '../../data/api'
import { createOpeningsStore, OpeningsStoreContext } from './openingsStore'

export function OpeningsStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createOpeningsStore())
  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (positions) store.getState().setPositions(positions)
  }, [positions, store])

  return (
    <OpeningsStoreContext.Provider value={store}>
      {children}
    </OpeningsStoreContext.Provider>
  )
}
