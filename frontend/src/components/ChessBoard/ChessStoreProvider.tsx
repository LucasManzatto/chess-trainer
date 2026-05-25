import type { ReactNode } from 'react'
import { ChessStoreContext, createChessStore } from './stores/chessStore'
import { useRef } from 'react'

export function ChessStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createChessStore> | null>(null)
  if (!storeRef.current) storeRef.current = createChessStore()
  return (
    <ChessStoreContext.Provider value={storeRef.current}>
      {children}
    </ChessStoreContext.Provider>
  )
}
