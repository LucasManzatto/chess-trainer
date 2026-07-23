import type { GamesFilters } from '../features/games/types'

export const gamesKeys = {
  profile:    ()                    => ['games-profile'] as const,
  syncStatus: ()                    => ['games-sync-status'] as const,
  all:        ()                    => ['games-list'] as const,
  list:       (f: GamesFilters)     => ['games-list', f] as const,
}

export const positionsKeys = {
  detail: (fen: string) => ['position-detail', fen] as const,
}

export const openingsKeys = {
  byFen: (fen: string) => ['opening', fen] as const,
  nearest: (fens: string[]) => ['opening-nearest', ...fens] as const,
}

export const trainKeys = {
  cards:    (side?: 'white' | 'black') => ['train', 'cards', side ?? 'all'] as const,
  due:      ()                          => ['train', 'due'] as const,
  coverage: ()                          => ['train', 'coverage'] as const,
  stats:    ()                          => ['train', 'stats'] as const,
  all:      ()                          => ['train'] as const,
}
