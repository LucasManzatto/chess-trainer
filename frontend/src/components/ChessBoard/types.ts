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

export type UseChessGameProps = {
  interactive?: boolean
  interactiveAtEnd?: boolean
  orientation?: 'white' | 'black'
  animationDurationInMs?: number
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}
