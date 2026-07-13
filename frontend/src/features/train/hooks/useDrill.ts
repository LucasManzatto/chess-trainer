import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDueCards } from '../../../data/hooks/useTrain'
import type { HistoryEntry } from '../../../lib/chess/types'
import type { TrainMode, TrainPhase, RepertoireCard } from '../types'

export type PageMode =
  | { type: 'default' }
  | { type: 'game_review'; gameId: number }
  | { type: 'drill'; trainMode: TrainMode; phase: TrainPhase }

type DrillBoardState = {
  history: HistoryEntry[]
  reset: () => void
  loadMoves: (moves: string[]) => void
  setOrientation: (orientation: 'white' | 'black') => void
  setInteractive: (interactive: boolean) => void
}

export function useDrill(
  boardState: DrillBoardState,
  pageMode: PageMode,
  setPageMode: Dispatch<SetStateAction<PageMode>>,
) {
  const { data: dueCards = [], refetch: refetchDueCards } = useDueCards()

  const trainPhase: TrainPhase = pageMode.type === 'drill' ? pageMode.phase : { type: 'idle' }
  const trainCard: RepertoireCard | null =
    trainPhase.type === 'awaiting_move' || trainPhase.type === 'revealed' ? trainPhase.card : null
  const trainRevealed = pageMode.type === 'drill' && trainPhase.type === 'revealed'
  const trainHideOverlay = pageMode.type === 'drill' && !trainRevealed

  const setPageModeDefault = () => {
    setPageMode({ type: 'default' })
    boardState.reset()
  }

  // Refetch due cards; land on awaiting_move with the card if one is found, done otherwise.
  const loadNextCard = () => {
    setPageMode(prev => (prev.type === 'drill' ? { ...prev, phase: { type: 'loading' } } : prev))
    void (async () => {
      const { data } = await refetchDueCards()
      const card = data?.[0] ?? null
      if (card) {
        boardState.reset()
        boardState.loadMoves(card.line)
        boardState.setOrientation(card.side)
        setPageModeDrill({ type: 'awaiting_move', card })
      } else {
        setPageModeDrill({ type: 'done' })
      }
    })()
  }

  // Evaluation bar/arrows/notes hide themselves via trainHideOverlay, derived from
  // trainPhase during render — this just makes the board playable.
  const startAwaitingMove = (phase: Extract<TrainPhase, { type: 'awaiting_move' }>) => {
    boardState.setInteractive(true)
    setPageMode(prev => (prev.type === 'drill' ? { ...prev, phase } : prev))
  }

  const setPageModeDrill = (phase: TrainPhase) => {
    if (phase.type === 'loading') return loadNextCard()
    if (phase.type === 'awaiting_move') return startAwaitingMove(phase)
    // when revealed, show everything again but keep board not interactive — done by
    // the effect below, since this phase can be set synchronously during render
    // (calling setInteractive here would mutate the store mid-render)
    if (phase.type === 'done') return setPageModeDefault()
    setPageMode(prev => (prev.type === 'drill' ? { ...prev, phase } : prev))
  }

  const startTrainSession = (mode: TrainMode) => {
    setPageMode({ type: 'drill', trainMode: mode, phase: { type: 'idle' } })
    setPageModeDrill({ type: 'loading' })
  }

  // Derived transition: history is the source of truth for "did the user answer yet".
  // Computed during render (not an effect) since it only sets this hook's own state —
  // setInteractive is an external store setter, so that part still needs an effect
  // (calling it during render updates a different component mid-render).
  if (
    trainPhase.type === 'awaiting_move' &&
    trainCard &&
    boardState.history.length === trainCard.line.length + 1
  ) {
    const last = boardState.history[boardState.history.length - 1]
    const answerUci = trainCard.answer.slice(0, 4)
    if (last.from + last.to === answerUci) toast.success('Correct!', { position: 'top-center' })
    else toast.error('Incorrect', { position: 'top-center' })
    setPageModeDrill({ type: 'revealed', card: trainCard })
  }

  useEffect(() => {
    if (trainPhase.type !== 'revealed') return
    boardState.setInteractive(false)
  }, [trainPhase, boardState.setInteractive])

  return {
    dueCards,
    trainPhase,
    trainCard,
    trainRevealed,
    trainHideOverlay,
    startTrainSession,
    setPageModeDrill,
    setPageModeDefault,
  }
}
