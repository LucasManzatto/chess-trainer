import { useEffect } from 'react'
import { useAuthSession } from '../../../hooks/useAuthSession'
import { useFavoritesStore } from '../stores/useFavoritesStore'
import { openingFavoritesApi } from '../api'

export function useFavorites() {
  const session = useAuthSession()
  const { setAll, toggle, ids, isLoaded } = useFavoritesStore()

  useEffect(() => {
    if (!session) return
    openingFavoritesApi.list().then(setAll).catch(() => setAll([]))
  }, [session, setAll])

  async function toggleFavorite(id: number) {
    const wasOn = ids.has(id)
    toggle(id)
    try {
      await openingFavoritesApi.toggle(id)
    } catch {
      toggle(id) // rollback
    }
  }

  async function bulkToggle(openingIds: number[]) {
    const favCount = openingIds.filter(id => ids.has(id)).length
    const targetState = favCount <= openingIds.length / 2
    const toChange = openingIds.filter(id => ids.has(id) !== targetState)
    toChange.forEach(id => toggle(id))
    try {
      await Promise.all(toChange.map(id => openingFavoritesApi.toggle(id)))
    } catch {
      toChange.forEach(id => toggle(id)) // rollback all
    }
  }

  return { ids, isLoaded, toggleFavorite, bulkToggle }
}
