export type CardState = 'new' | 'learning' | 'review' | 'relearning'

export type RepertoireCard = {
  id: string
  position_key: string
  fen: string
  side: 'white' | 'black'
  answer: string        // UCI e.g. "e2e4"
  line: string[]        // SAN path to reach position
  opening_eco: string | null
  opening_name: string | null
  plan: string | null
  ease: number
  interval_days: number
  due: string           // ISO datetime
  reps: number
  lapses: number
  state: CardState
}

export type CardCreate = {
  position_key: string
  fen: string
  side: 'white' | 'black'
  answer: string
  line: string[]
  opening_eco?: string | null
  opening_name?: string | null
  plan?: string | null
}

export type CardReview = {
  position_key: string
  grade: 0 | 1 | 2 | 3 | 4 | 5
}

export type CardDelete = {
  position_key: string
}

export type CoverageStats = {
  white: number
  black: number
  total: number
}
