export type * from '../../../chess/types'

export type UseChessGameProps = {
  interactive?: boolean
  interactiveAtEnd?: boolean
  orientation?: 'white' | 'black'
  animationDurationInMs?: number
  onMove?: (move: import('../../../chess/types').MoveResult) => void
  onGameOver?: (result: import('../../../chess/types').GameOverResult) => void
}
