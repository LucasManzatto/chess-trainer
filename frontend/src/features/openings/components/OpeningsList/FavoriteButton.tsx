import { useOpeningFavorites } from '../../hooks/useOpeningFavorites'

interface FavoriteButtonProps {
  openingId: number
}

export function FavoriteButton({ openingId }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useOpeningFavorites()
  const active = isFavorite(openingId)

  return (
    <button
      onClick={e => { e.stopPropagation(); toggle.mutate(openingId) }}
      className={`flex-shrink-0 px-1 py-1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
        active ? 'text-amber-400 opacity-100' : 'text-white/25 hover:text-amber-400/70'
      }`}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}
