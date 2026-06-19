export const positionsKeys = {
  position:      (fen: string) => ['position', fen] as const,
  moves:         (fen: string) => ['position-moves', fen] as const,
  comments:      (fen: string) => ['position-comments', fen] as const,
  moveStats:     (moves: string[]) => ['move-stats', moves] as const,
}
