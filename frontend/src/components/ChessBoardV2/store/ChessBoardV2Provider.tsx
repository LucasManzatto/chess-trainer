import { useRef, type ReactNode } from 'react'
import {
  ChessBoardStoreContext,
  createChessBoardStore,
  type ChessBoardStoreConfig,
} from './chessBoardStore'

type Props = {
  children: ReactNode
  config?: ChessBoardStoreConfig
}

export function ChessBoardV2Provider({ children, config }: Props) {
  const storeRef = useRef<ReturnType<typeof createChessBoardStore>>(null)
  if (!storeRef.current) {
    storeRef.current = createChessBoardStore(config)
  }

  return (
    <ChessBoardStoreContext.Provider value={storeRef.current}>
      {children}
    </ChessBoardStoreContext.Provider>
  )
}
