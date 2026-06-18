import { useEffect, useRef, useState } from 'react'
import { useChessBoardStoreApi } from '../../../../features/board'
import type { TrainPhase, TrainMode } from '../../../../features/train/store/trainStore'
import { useDueCards } from '../../../../features/train/hooks/useDueCards'
import type { RepertoireCard } from '../../../../features/train/types'

/**
 * Drives the drill session state machine. Phases transition linearly:
 *
 *   idle → loading → awaiting_move → revealed → done → loading → …
 *
 * Each phase has exactly one useEffect responsible for its side-effects
 * and the transition to the next phase. No effect touches phases it
 * doesn't own.
 */
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

  // ── loading ────────────────────────────────────────────────────────────────
  // Picks the first due card and advances to awaiting_move.
  // Reads dueCards via ref (not dep) so a background refetch while we're
  // still in loading doesn't re-fire and pick a different card mid-transition.
  useEffect(() => {
    if (phase.type !== 'loading') return
    // dueCardsRef may still hold the just-graded card if its optimistic
    // cache removal (in useReviewCard's onMutate) hasn't landed yet —
    // exclude it explicitly so we never re-show the card we just answered.
    const cards = dueCardsRef.current.filter(c => c.position_key !== currentCard?.position_key)
    console.log('[train] phase: loading', { dueCards: cards.length })
    const card = cards[0] ?? null
    if (!card) {
      setPhase({ type: 'done' })
      return
    }
    setCurrentCard(card)
    setPhase({ type: 'awaiting_move' })
  }, [phase, currentCard])

  // ── awaiting_move ──────────────────────────────────────────────────────────
  // Sets up the board for the current card and subscribes to the board store
  // to detect when the user plays a move.
  useEffect(() => {
    if (phase.type !== 'awaiting_move') return
    if (!currentCard) return

    const { loadMoves, setOrientation, setInteractive } = boardStore.getState()
    // Replay the opening line so the board is at the quiz position.
    loadMoves(currentCard.line)
    setOrientation(currentCard.side)
    setInteractive(true)

    // We expect exactly one more move beyond the pre-loaded line.
    const expectedLength = currentCard.line.length + 1
    // Slice to 4 chars (from+to) to ignore promotion suffix when comparing.
    const answerUci = currentCard.answer.slice(0, 4)

    // triggered prevents double-firing if Zustand notifies multiple times
    // before React processes the setPhase('revealed') state update.
    let triggered = false
    return boardStore.subscribe((state) => {
      if (triggered || state.history.length !== expectedLength) return
      triggered = true
      const last = state.history[state.history.length - 1]
      setIsCorrect(last.from + last.to === answerUci)
      setPhase({ type: 'revealed' })
    })
  }, [phase, currentCard, boardStore])

  // ── revealed ───────────────────────────────────────────────────────────────
  // Locks the board so the user can't make further moves while grading.
  // isCorrect is intentionally excluded from deps: it's set atomically with
  // setPhase('revealed') so it's always fresh when this effect runs, and we
  // don't want a stale-closure re-run if isCorrect somehow changes later.
  useEffect(() => {
    if (phase.type !== 'revealed') return
    console.log('[train] phase: revealed', { isCorrect })
    boardStore.getState().setInteractive(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, boardStore])

  // ── done ──────────────────────────────────────────────────────────────────
  // Resets the board and either starts the next card (loading) or stays at
  // done so the SessionSummary is shown.
  // Reads dueCards via ref (not dep) to avoid re-firing when the 5s poll
  // returns new data while the session is genuinely over — that would call
  // reset() and restart the session without user intent.
  useEffect(() => {
    if (phase.type !== 'done') return
    const cards = dueCardsRef.current
    console.log('[train] phase: done', { dueCards: cards.length })
    const { reset, setInteractive } = boardStore.getState()
    // reset() preserves the current interactive value, so we force it back
    // to true so the next card's board is immediately usable.
    reset()
    setInteractive(true)
    if (cards.length > 0) {
      setPhase({ type: 'loading' })
    }
  }, [phase, boardStore])

  return { phase, setPhase, currentCard, setCurrentCard, isCorrect, mode, setMode }
}
