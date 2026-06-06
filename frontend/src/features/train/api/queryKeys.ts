export const trainKeys = {
  cards:    (side?: 'white' | 'black') => ['train', 'cards', side ?? 'all'] as const,
  due:      ()                          => ['train', 'due'] as const,
  coverage: ()                          => ['train', 'coverage'] as const,
  all:      ()                          => ['train'] as const,
}
