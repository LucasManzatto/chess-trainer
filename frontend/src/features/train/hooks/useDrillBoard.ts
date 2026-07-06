import { useEffect, useRef, useState } from 'react'
import type { HistoryEntry } from '../../../lib/chess/types'
import type { TrainPhase, TrainMode, RepertoireCard } from '../types'

export function useDrillBoard(
  dueCards: RepertoireCard[],
  history: HistoryEntry[],
  loadMoves: (moves: string[]) => void,
  setOrientation: (orientation: 'white' | 'black') => void,
  setInteractive: (interactive: boolean) => void,
  reset: () => void,
) {
  const [phase, setPhase] = useState<TrainPhase>({ type: 'idle' })
  const [mode, setMode] = useState<TrainMode>('drill')
  const [currentCard, setCurrentCard] = useState<RepertoireCard | null>(null)
  // null = not yet graded, boolean = result of last answered card
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  // Mirror dueCards into a ref so the loading/done phases read the latest value
  // without re-firing every 5s poll refetch while sitting on the summary screen.
  const dueCardsRef = useRef(dueCards)
  useEffect(() => { dueCardsRef.current = dueCards }, [dueCards])

  useEffect(() => {
    if (phase.type !== 'loading') return
    // Excludes the just-graded card in case optimistic removal hasn't landed yet.
    const cards = dueCardsRef.current.filter(c => c.position_id !== currentCard?.position_id)
    console.log('[train] phase: loading', { dueCards: cards.length })
    const card = cards[0] ?? null
    if (!card) { setPhase({ type: 'done' }); return }
    // loadMoves runs here (not in a separate awaiting_move effect) so the store's
    // `history` and this hook's phase/currentCard land in the same render — otherwise
    // there'd be a render where phase is already 'awaiting_move' but history still
    // holds the previous card's data, which the reveal check below could misread.
    loadMoves(card.line)
    setOrientation(card.side)
    setInteractive(true)
    setCurrentCard(card)
    setPhase({ type: 'awaiting_move' })
  }, [phase, currentCard, loadMoves, setOrientation, setInteractive])

  // Derived transition: history is the source of truth for "did the user answer yet".
  // Computed during render (not an effect) since it's a pure function of props/state.
  if (
    phase.type === 'awaiting_move' &&
    currentCard &&
    history.length === currentCard.line.length + 1
  ) {
    const last = history[history.length - 1]
    const answerUci = currentCard.answer.slice(0, 4)
    setIsCorrect(last.from + last.to === answerUci)
    setPhase({ type: 'revealed' })
  }

  useEffect(() => {
    if (phase.type !== 'revealed') return
    console.log('[train] phase: revealed', { isCorrect })
    setInteractive(false)
  }, [phase, isCorrect, setInteractive])

  useEffect(() => {
    if (phase.type !== 'done') return
    const cards = dueCardsRef.current
    console.log('[train] phase: done', { dueCards: cards.length })
    reset()
    setInteractive(true)
    if (cards.length > 0) setPhase({ type: 'loading' })
  }, [phase, reset, setInteractive])

  return { phase, setPhase, currentCard, setCurrentCard, isCorrect, mode, setMode }
}
