import type { GamesFilters } from '../features/games/types'

export const engineKeys = {
  moveStats: (moves: string[]) => ['move-stats', moves] as const,
}

export const gamesKeys = {
  profile:    ()                    => ['games-profile'] as const,
  syncStatus: ()                    => ['games-sync-status'] as const,
  list:       (f: GamesFilters)     => ['games-list', f] as const,
}

export const positionsKeys = {
  position:      (fen: string) => ['position', fen] as const,
  moves:         (fen: string) => ['position-moves', fen] as const,
  comments:      (fen: string) => ['position-comments', fen] as const,
  moveStats:     (moves: string[]) => ['move-stats', moves] as const,
  annotationArrows:  (fen: string) => ['position-annotation-arrows', fen] as const,
  annotationCircles: (fen: string) => ['position-annotation-circles', fen] as const,
}

export const trainKeys = {
  cards:    (side?: 'white' | 'black') => ['train', 'cards', side ?? 'all'] as const,
  due:      ()                          => ['train', 'due'] as const,
  coverage: ()                          => ['train', 'coverage'] as const,
  stats:    ()                          => ['train', 'stats'] as const,
  all:      ()                          => ['train'] as const,
}
