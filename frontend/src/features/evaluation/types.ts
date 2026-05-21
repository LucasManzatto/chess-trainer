export type EvaluationScore = {
  type: 'cp' | 'mate'
  value: number
}

export type EvaluationResult = {
  score?: EvaluationScore
  isLoading: boolean
  error: boolean
}
