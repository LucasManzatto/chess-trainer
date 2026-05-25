import type { GamesFilters } from '../types'

export const gamesKeys = {
  profile:    ()                    => ['games-profile'] as const,
  syncStatus: ()                    => ['games-sync-status'] as const,
  list:       (f: GamesFilters)     => ['games-list', f] as const,
}
