import { useEffect, useState } from 'react'
import type { HistoryEntry } from '../../../lib/chess/types'
import type { TrainPhase, TrainMode, RepertoireCard } from '../types'
import { useDueCards } from '../../../data/hooks/useTrain'

export function useDrillBoard(
  history: HistoryEntry[],
  loadMoves: (moves: string[]) => void,
  setOrientation: (orientation: 'white' | 'black') => void,
  setInteractive: (interactive: boolean) => void,
  reset: () => void,
  initialMode: TrainMode = 'drill',
) {
  const { data: dueCards = [], refetch: refetchDueCards } = useDueCards()
  const [phase, setPhase] = useState<TrainPhase>({ type: 'idle' })
  const [mode, setMode] = useState<TrainMode>(initialMode)
  const [currentCard, setCurrentCard] = useState<RepertoireCard | null>(null)
  // null = not yet graded, boolean = result of last answered card
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  // Loads the next due card. Called directly from the Start button and after
  // grading, rather than reactively from a phase-watching effect. Returns
  // whether a card was found — the caller decides what to do if not.
  const startSession = async () => {
    reset()
    const { data } = await refetchDueCards()
    const card = data?.[0] ?? null
    if (!card) {
      setCurrentCard(null)
      setIsCorrect(null)
      return false
    }
    loadMoves(card.line)
    setOrientation(card.side)
    setInteractive(true)
    setCurrentCard(card)
    setPhase({ type: 'awaiting_move' })
    return true
  }

  // Derived transition: history is the source of truth for "did the user answer yet".
  // Computed during render (not an effect) since it only sets this hook's own state —
  // setInteractive is an external store setter, so that part still needs an effect
  // (calling it during render updates a different component mid-render).
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
    setInteractive(false)
  }, [phase, setInteractive])

  return { phase, setPhase, currentCard, setCurrentCard, isCorrect, mode, setMode, dueCards, startSession }
}
