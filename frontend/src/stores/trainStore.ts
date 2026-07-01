import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { RepertoireCard } from '../features/train/types'

// ── Phase discriminated union ──────────────────────────────────────────────────

export type TrainMode = 'drill' | 'spar'

export type TrainPhase =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'awaiting_move' }
  | { type: 'revealed' }
  | { type: 'done' }

export type SessionStats = { total: number; correct: number }

// ── Store types ────────────────────────────────────────────────────────────────

interface TrainState {
  mode: TrainMode
  phase: TrainPhase
  stats: SessionStats
  /** Position IDs seen this session — prevents re-quizzing the same position. */
  seenPositionIds: Set<string>
  /** Due cards loaded by the provider for the current session. */
  dueCards: RepertoireCard[]
  /** All user cards — used by spar mode for the position→card lookup. */
  allCards: RepertoireCard[]
  /** Explicitly committed current card — set by advanceCard(), not derived. */
  currentCard: RepertoireCard | null
}

interface TrainActions {
  setMode: (mode: TrainMode) => void
  setPhase: (phase: TrainPhase) => void
  setDueCards: (cards: RepertoireCard[]) => void
  setAllCards: (cards: RepertoireCard[]) => void
  markSeen: (positionId: string) => void
  recordResult: (correct: boolean) => void
  /** Pick next unseen card and commit it to currentCard. */
  advanceCard: () => void
  /** Reset session state, clear seen ids and stats. */
  resetSession: () => void
}

export type TrainStoreType = TrainState & TrainActions

// ── Selectors ──────────────────────────────────────────────────────────────────

export function getCardsByPositionId(
  state: Pick<TrainStoreType, 'allCards'>,
): Map<string, RepertoireCard> {
  return new Map(state.allCards.map(c => [c.position_id, c]))
}

export function getDueCount(state: Pick<TrainStoreType, 'dueCards' | 'seenPositionIds'>): number {
  return state.dueCards.filter(c => !state.seenPositionIds.has(c.position_id)).length
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createTrainStore() {
  return createStore<TrainStoreType>()(set => ({
    mode: 'drill',
    phase: { type: 'idle' },
    stats: { total: 0, correct: 0 },
    seenPositionIds: new Set(),
    dueCards: [],
    allCards: [],
    currentCard: null,

    // Full session reset on mode switch — prevents stale seen ids / stats carrying over.
    setMode: mode =>
      set({
        mode,
        phase: { type: 'idle' },
        stats: { total: 0, correct: 0 },
        seenPositionIds: new Set(),
        currentCard: null,
      }),

    setPhase: phase => set({ phase }),

    setDueCards: dueCards =>
      set(s => ({
        dueCards,
        currentCard: dueCards.find(c => !s.seenPositionIds.has(c.position_id)) ?? null,
      })),

    setAllCards: allCards => set({ allCards }),

    advanceCard: () =>
      set(s => ({
        currentCard: s.dueCards.find(c => !s.seenPositionIds.has(c.position_id)) ?? null,
      })),

    markSeen: positionId =>
      set(s => {
        const seenPositionIds = new Set(s.seenPositionIds).add(positionId)
        return {
          seenPositionIds,
          currentCard: s.dueCards.find(c => !seenPositionIds.has(c.position_id)) ?? null,
        }
      }),

    recordResult: correct =>
      set(s => ({
        stats: {
          total: s.stats.total + 1,
          correct: s.stats.correct + (correct ? 1 : 0),
        },
      })),

    resetSession: () =>
      set({
        phase: { type: 'idle' },
        stats: { total: 0, correct: 0 },
        seenPositionIds: new Set(),
        currentCard: null,
      }),
  }))
}

// ── Context ────────────────────────────────────────────────────────────────────

type TrainStoreApi = ReturnType<typeof createTrainStore>

const TrainStoreContext = createContext<TrainStoreApi | null>(null)

export function useTrainStoreApi(): TrainStoreApi {
  const store = useContext(TrainStoreContext)
  if (!store) throw new Error('useTrainStore must be used inside TrainStoreProvider')
  return store
}

export function useTrainStore<T>(selector: (state: TrainStoreType) => T): T {
  return useStore(useTrainStoreApi(), selector)
}

export { TrainStoreContext }
