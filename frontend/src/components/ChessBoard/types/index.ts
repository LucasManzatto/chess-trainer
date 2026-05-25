export type MoveResult = {
  from: string
  to: string
  san: string
  promotion?: string
  fen: string
}

export type GameOverResult = {
  result: 'checkmate' | 'stalemate' | 'draw'
  winner?: 'w' | 'b'
}

export type HistoryEntry = {
  san: string
  fen: string
  from: string
  to: string
}

export type EvaluationScore = { type: 'cp' | 'mate'; value: number }

export type EvaluationResult = {
  score: EvaluationScore | undefined
  isLoading: boolean
  bestMove: string | undefined
  error: boolean
}

export type ThreatSquares = { hanging: string[]; pinned: string[] }

export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export type MoveAnalysis = {
  san: string
  cp_loss: number
  best_move: string
  classification: MoveClassification
}

export type GameAnalysis = {
  moves: MoveAnalysis[]
  white_accuracy: number
  black_accuracy: number
  depth: number
  analyzed_at: string
}

export type UseChessGameProps = {
  interactive?: boolean
  interactiveAtEnd?: boolean
  orientation?: 'white' | 'black'
  animationDurationInMs?: number
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}
