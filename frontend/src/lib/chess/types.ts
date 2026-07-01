export type MovePair = {
  moveNumber: number
  white: string
  black: string | null
}

export type ActiveMove = {
  moveNumber: number
  color: 'white' | 'black'
}

export type AnnotationColor = 'G' | 'R' | 'B' | 'Y'

export type AnnotationArrow = { from: string; to: string; color: AnnotationColor }

export type AnnotationCircle = { square: string; color: AnnotationColor }

export type Annotation = {
  arrows: AnnotationArrow[]
  circles: AnnotationCircle[]
  comment?: string
}

export type HistoryEntry = {
  san: string
  lan: string
  from: string
  to: string
  fen: string
}

export type GameMetadata = {
  white?: string
  black?: string
  event?: string
  date?: string
}

export type MoveResult = {
  from: string
  to: string
  san: string
  promotion?: string
  fen: string
  gameOver: GameOverResult | null
}

export type GameOverResult = {
  result: 'checkmate' | 'stalemate' | 'draw'
  winner?: 'w' | 'b'
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
  score?: number
}

export type GameAnalysis = {
  moves: MoveAnalysis[]
  white_accuracy: number
  black_accuracy: number
  depth: number
  analyzed_at: string
  initial_score?: number
}
