export const openingsKeys = {
  comments:         (openingId: number) => ['opening-comments', openingId] as const,
  positionComments: (openingId: number) => ['position-comments', openingId] as const,
  favorites:        ()                  => ['opening-favorites'] as const,
  drillQueue:       ()                  => ['drill-queue'] as const,
}
