export const positionsKeys = {
  userPositions: () => ['user-positions'] as const,
  comments:      (fen: string) => ['position-comments', fen] as const,
}
