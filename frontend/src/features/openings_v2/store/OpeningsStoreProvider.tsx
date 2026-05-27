import { useRef, useEffect, type ReactNode } from 'react'
import { useOpenings } from '../../openings/hooks/useOpenings'
import { createOpeningsStore, OpeningsStoreContext } from './openingsStore'

export function OpeningsStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createOpeningsStore> | null>(null)
  if (!storeRef.current) storeRef.current = createOpeningsStore()

  const { data: openings } = useOpenings()

  useEffect(() => {
    if (openings) storeRef.current!.getState().setOpenings(openings)
  }, [openings])

  return (
    <OpeningsStoreContext.Provider value={storeRef.current}>
      {children}
    </OpeningsStoreContext.Provider>
  )
}
