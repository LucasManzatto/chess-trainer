import { useState, type ReactNode } from 'react'
import {
  ChessBoardStoreContext,
  createChessBoardStore,
  type ChessBoardStoreConfig,
} from './chessBoardStore'

type Props = {
  children: ReactNode
  config?: ChessBoardStoreConfig
}

export function ChessBoardProvider({ children, config }: Props) {
  const [store] = useState(() => createChessBoardStore(config))

  return (
    <ChessBoardStoreContext.Provider value={store}>
      {children}
    </ChessBoardStoreContext.Provider>
  )
}
