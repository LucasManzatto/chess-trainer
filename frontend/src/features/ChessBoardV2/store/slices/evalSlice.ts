import type { StateCreator } from 'zustand'
import type { EvaluationScore } from '../../../../chess/types'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type EvalSlice = {
  evalScore: EvaluationScore | undefined
  evalBestMove: string | undefined

  setEvaluation: (score: EvaluationScore | undefined, bestMove: string | undefined) => void
}

export function getInitialEvalState(): Pick<EvalSlice, 'evalScore' | 'evalBestMove'> {
  return {
    evalScore: undefined,
    evalBestMove: undefined,
  }
}

export const createEvalSlice: StateCreator<ChessBoardStoreType, [], [], EvalSlice> = (set) => ({
  ...getInitialEvalState(),

  setEvaluation: (evalScore, evalBestMove) => set({ evalScore, evalBestMove }),
})
