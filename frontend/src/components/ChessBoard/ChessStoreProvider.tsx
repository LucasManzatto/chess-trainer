import { useState, type ReactNode } from 'react'
import { ChessStoreContext, createChessStore } from './stores/chessStore'

export function ChessStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createChessStore())
  return (
    <ChessStoreContext.Provider value={store}>
      {children}
    </ChessStoreContext.Provider>
  )
}
