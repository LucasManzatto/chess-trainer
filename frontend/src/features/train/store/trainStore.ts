import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { RepertoireCard } from '../types'

// ── Phase discriminated union ──────────────────────────────────────────────────

export type TrainMode = 'drill' | 'spar'

export type TrainPhase =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'awaiting_move'; card: RepertoireCard; quizLineLength: number }
  | { type: 'revealed'; card: RepertoireCard; correct: boolean }
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
}

interface TrainActions {
  setMode: (mode: TrainMode) => void
  setPhase: (phase: TrainPhase) => void
  setDueCards: (cards: RepertoireCard[]) => void
  setAllCards: (cards: RepertoireCard[]) => void
  markSeen: (positionKey: string) => void
  recordResult: (correct: boolean) => void
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

export function getNextCard(
  state: Pick<TrainStoreType, 'dueCards' | 'seenPositionKeys'>,
): RepertoireCard | null {
  return state.dueCards.find(c => !state.seenPositionKeys.has(c.position_key)) ?? null
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

    // Full session reset on mode switch — prevents stale seen keys / stats carrying over.
    setMode: mode =>
      set({
        mode,
        phase: { type: 'idle' },
        stats: { total: 0, correct: 0 },
        seenPositionKeys: new Set(),
      }),

    setPhase: phase => set({ phase }),

    setDueCards: dueCards => set({ dueCards }),

    setAllCards: allCards => set({ allCards }),

    markSeen: positionKey =>
      set(s => ({ seenPositionKeys: new Set(s.seenPositionKeys).add(positionKey) })),

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
