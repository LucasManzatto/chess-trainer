export type Position = {
  id: string
  fen: string
  name: string | null
  moves: string[]
  created_at: string
}

export type PositionComment = {
  id: number
  fen: string
  content: string
  created_at: string
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

export type PositionDetail = {
  position: Position | null
  comments: PositionComment[]
  arrows: PositionAnnotationArrow[]
  circles: PositionAnnotationCircle[]
}
