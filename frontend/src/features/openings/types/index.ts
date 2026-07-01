export type Position = {
  id: string
  fen: string
  name: string | null
  moves: string[]
  created_at: string
}

export type PositionMove = {
  id: string
  from_position_id: string
  to_position_id: string
  san: string
  lan: string
  is_main_line: boolean
  commentary: string | null
}

export type PositionComment = {
  id: number
  user_id: string
  position_id: string
  content: string
  created_at: string
}

export type MoveStat = {
  san: string
  uci: string
  white: number
  draws: number
  black: number
  total: number
  percentage: number
}

export type MoveStatsResponse = {
  moves: MoveStat[]
  total_games: number
}

export type PositionMoveCreateBody = {
  from_fen: string
  to_fen: string
  san: string
  lan: string
  is_main_line?: boolean
  commentary?: string | null
}

export type PositionAnnotationArrow = {
  id: number
  fen: string
  from_square: string
  to_square: string
  color: string
}

export type PositionAnnotationCircle = {
  id: number
  fen: string
  square: string
  color: string
}
