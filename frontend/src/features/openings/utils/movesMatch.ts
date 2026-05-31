import type { Opening } from '../types'

/** played moves are a prefix of opening.moves */
export const isPrefix = (played: string[], opening: Opening) =>
  played.length <= opening.moves.length && played.every((m, i) => m === opening.moves[i])

/** played moves exactly match opening.moves */
export const isExact = (played: string[], opening: Opening) =>
  played.length === opening.moves.length && played.every((m, i) => m === opening.moves[i])
