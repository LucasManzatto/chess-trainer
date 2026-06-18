export type Position = {
  fen: string
  eco: string | null
  name: string | null
  pgn: string | null
  moves: string[]
}

export type PositionComment = {
  id: number
  user_id: string
  fen: string
  content: string
  created_at: string
}
