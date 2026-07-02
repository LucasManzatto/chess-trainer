import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../board/types'

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

export type PositionAnnotationArrow = BoardAnnotationArrow & { id: number; fen: string }

export type PositionAnnotationCircle = BoardAnnotationCircle & { id: number; fen: string }

export type PositionDetail = {
  position: Position | null
  comments: PositionComment[]
  arrows: PositionAnnotationArrow[]
  circles: PositionAnnotationCircle[]
}
