import { useState, useEffect, type ReactNode } from 'react'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { createOpeningsStore, OpeningsStoreContext } from './openingsStore'

export function OpeningsStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createOpeningsStore())
  const { data: openings } = useOpenings()

  useEffect(() => {
    if (openings) store.getState().setOpenings(openings)
  }, [openings, store])

  return (
    <OpeningsStoreContext.Provider value={store}>
      {children}
    </OpeningsStoreContext.Provider>
  )
}
