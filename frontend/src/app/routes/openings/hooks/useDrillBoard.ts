import { useEffect, useRef, useState } from 'react'
import { useChessBoardStoreApi } from '../../../../features/board'
import type { TrainPhase, TrainMode } from '../../../../stores/trainStore'
import { useDueCards } from '../../../../data/hooks/useTrain'
import type { RepertoireCard } from '../../../../features/train/types'

export function useDrillBoard() {
  const boardStore = useChessBoardStoreApi()
  const [phase, setPhase] = useState<TrainPhase>({ type: 'idle' })
  const [mode, setMode] = useState<TrainMode>('drill')
  const [currentCard, setCurrentCard] = useState<RepertoireCard | null>(null)
  // null = not yet graded, boolean = result of last answered card
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const { data: dueCards = [] } = useDueCards()

  // Mirror dueCards into a ref so phase effects can read the latest value
  // without declaring dueCards as a dependency. If they did, the 5s poll
  // refetch would re-fire effects while the session is mid-flight.
  const dueCardsRef = useRef(dueCards)
  useEffect(() => { dueCardsRef.current = dueCards }, [dueCards])

  useEffect(() => {
    switch (phase.type) {
      case 'loading': {
        // dueCardsRef excludes the just-graded card in case optimistic removal hasn't landed yet.
        const cards = dueCardsRef.current.filter(c => c.position_id !== currentCard?.position_id)
        console.log('[train] phase: loading', { dueCards: cards.length })
        const card = cards[0] ?? null
        if (!card) { setPhase({ type: 'done' }); return }
        setCurrentCard(card)
        setPhase({ type: 'awaiting_move' })
        break
      }
      case 'awaiting_move': {
        if (!currentCard) return
        const { loadMoves, setOrientation, setInteractive } = boardStore.getState()
        loadMoves(currentCard.line)
        setOrientation(currentCard.side)
        setInteractive(true)
        const expectedLength = currentCard.line.length + 1
        const answerUci = currentCard.answer.slice(0, 4)
        // triggered prevents double-firing before React processes the setPhase update.
        let triggered = false
        return boardStore.subscribe((state) => {
          if (triggered || state.history.length !== expectedLength) return
          triggered = true
          const last = state.history[state.history.length - 1]
          setIsCorrect(last.from + last.to === answerUci)
          setPhase({ type: 'revealed' })
        })
      }
      case 'revealed': {
        console.log('[train] phase: revealed', { isCorrect })
        boardStore.getState().setInteractive(false)
        break
      }
      case 'done': {
        const cards = dueCardsRef.current
        console.log('[train] phase: done', { dueCards: cards.length })
        const { reset, setInteractive } = boardStore.getState()
        reset()
        setInteractive(true)
        if (cards.length > 0) setPhase({ type: 'loading' })
        break
      }
    }
  }, [phase, currentCard, boardStore])

  return { phase, setPhase, currentCard, setCurrentCard, isCorrect, mode, setMode }
}
