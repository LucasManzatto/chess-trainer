import { useState, useEffect, type ReactNode } from 'react'
import { useDueCards, useRepertoireCards } from '../../data/hooks/useTrain'
import { createTrainStore, TrainStoreContext } from './trainStore'

interface TrainStoreProviderProps {
  children: ReactNode
  side?: 'white' | 'black'
}

export function TrainStoreProvider({ children, side }: TrainStoreProviderProps) {
  const [store] = useState(() => createTrainStore())

  const { data: dueCards } = useDueCards()
  // Fetch only cards matching the current board orientation for spar mode lookup.
  const { data: allCards } = useRepertoireCards(side)

  useEffect(() => {
    const s = store.getState()
    if (dueCards) s.setDueCards(dueCards)
    if (allCards) s.setAllCards(allCards)
  }, [dueCards, allCards, store])

  return (
    <TrainStoreContext.Provider value={store}>
      {children}
    </TrainStoreContext.Provider>
  )
}
