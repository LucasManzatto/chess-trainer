import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { RepertoireCard } from '../types'

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
  /** Position keys seen this session — prevents re-quizzing transpositions. */
  seenPositionKeys: Set<string>
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
  markSeen: (positionKey: string) => void
  recordResult: (correct: boolean) => void
  /** Pick next unseen card and commit it to currentCard. */
  advanceCard: () => void
  /** Reset session state, clear seen keys and stats. */
  resetSession: () => void
}

export type TrainStoreType = TrainState & TrainActions

// ── Selectors ──────────────────────────────────────────────────────────────────

export function getCardsByPositionKey(
  state: Pick<TrainStoreType, 'allCards'>,
): Map<string, RepertoireCard> {
  return new Map(state.allCards.map(c => [c.position_key, c]))
}

export function getDueCount(state: Pick<TrainStoreType, 'dueCards' | 'seenPositionKeys'>): number {
  return state.dueCards.filter(c => !state.seenPositionKeys.has(c.position_key)).length
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createTrainStore() {
  return createStore<TrainStoreType>()(set => ({
    mode: 'drill',
    phase: { type: 'idle' },
    stats: { total: 0, correct: 0 },
    seenPositionKeys: new Set(),
    dueCards: [],
    allCards: [],
    currentCard: null,

    // Full session reset on mode switch — prevents stale seen keys / stats carrying over.
    setMode: mode =>
      set({
        mode,
        phase: { type: 'idle' },
        stats: { total: 0, correct: 0 },
        seenPositionKeys: new Set(),
        currentCard: null,
      }),

    setPhase: phase => set({ phase }),

    setDueCards: dueCards =>
      set(s => ({
        dueCards,
        currentCard: dueCards.find(c => !s.seenPositionKeys.has(c.position_key)) ?? null,
      })),

    setAllCards: allCards => set({ allCards }),

    advanceCard: () =>
      set(s => ({
        currentCard: s.dueCards.find(c => !s.seenPositionKeys.has(c.position_key)) ?? null,
      })),

    markSeen: positionKey =>
      set(s => {
        const seenPositionKeys = new Set(s.seenPositionKeys).add(positionKey)
        return {
          seenPositionKeys,
          currentCard: s.dueCards.find(c => !seenPositionKeys.has(c.position_key)) ?? null,
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
        seenPositionKeys: new Set(),
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
