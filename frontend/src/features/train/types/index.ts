export type CardState = 'new' | 'learning' | 'review' | 'relearning'

export type RepertoireCard = {
  id: string
  position_id: string
  side: 'white' | 'black'
  user_plan: string | null
  ease: number
  interval_days: number
  due: string           // ISO datetime
  reps: number
  lapses: number
  state: CardState
  // Computed by backend from positions.moves — not stored in DB
  fen: string
  line: string[]        // SAN moves to replay to reach drill position
  answer: string        // UCI of the move to play
  name: string | null
}

export type CardCreate = {
  fen: string           // FEN after the complete line including the answer
  moves: string[]       // Full SAN line including the answer
  side: 'white' | 'black'
  name?: string | null
  user_plan?: string | null
  position_id?: string  // set when a card already exists at this position
}

export type CardReview = {
  position_id: string
  grade: 0 | 1 | 2 | 3 | 4 | 5
}

export type CardDelete = {
  position_id: string
}

export type CoverageStats = {
  white: number
  black: number
  total: number
}

export type TrainStats = {
  total: number
  due: number
  new: number
  learning: number
  review: number
  relearning: number
}

export type TrainMode = 'drill' | 'spar'

export type TrainPhase =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'awaiting_move'; card: RepertoireCard }
  | { type: 'revealed'; card: RepertoireCard }
  | { type: 'done' }
