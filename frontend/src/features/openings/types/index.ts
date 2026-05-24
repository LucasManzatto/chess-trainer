export type Opening = {
  id: number
  eco: string
  name: string
  pgn: string
  fen: string
  moves: string[]
}

export type OpeningComment = {
  id: number
  user_id: string
  opening_id: number
  content: string
  created_at: string
}

export type PositionComment = {
  id: number
  user_id: string
  opening_id: number
  move_index: number
  fen: string
  content: string
  created_at: string
}

export type DrillQueueItem = {
  opening_id: number
  eco: string
  name: string
  pgn: string
  fen: string
  moves: string[]
  ease_factor: number
  interval_days: number
  due_date: string
  repetitions: number
}

export type DrillGrade = 0 | 3 | 4 | 5

export function openingColor(o: { moves: string[] }): 'white' | 'black' {
  return o.moves.length % 2 === 1 ? 'white' : 'black'
}
