export type EvaluationScore = {
  type: 'cp' | 'mate'
  value: number
}

export type EvaluationResult = {
  score?: EvaluationScore
  bestMove?: string
  isLoading: boolean
  error: boolean
}
