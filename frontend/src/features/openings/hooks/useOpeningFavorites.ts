import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingFavoritesApi } from '../api'
import { openingsKeys } from '../api/queryKeys'

export function useOpeningFavorites() {
  const qc = useQueryClient()
  const key = openingsKeys.favorites()

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => openingFavoritesApi.list(signal),
  })

  const toggle = useMutation({
    mutationFn: (openingId: number) => openingFavoritesApi.toggle(openingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const isFavorite = useCallback((openingId: number) => favorites.includes(openingId), [favorites])

  return { favorites, isLoading, toggle, isFavorite }
}
