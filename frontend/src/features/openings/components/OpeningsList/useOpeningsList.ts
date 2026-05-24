import { useState, useMemo } from 'react'
import type { Opening } from '../../types'
import { useFavorites } from '../../hooks/useFavorites'

export type ViewMode = 'list' | 'name' | 'move'

export function useOpeningsList(openings: Opening[], defaultViewMode: ViewMode = 'list') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { ids: favoriteIds, toggleFavorite, bulkToggle } = useFavorites()

  const displayed = useMemo(() => {
    if (!showFavoritesOnly) return openings
    return openings.filter(o => favoriteIds.has(o.id))
  }, [openings, showFavoritesOnly, favoriteIds])

  function toggleFavoritesFilter() {
    setShowFavoritesOnly(v => !v)
  }

  return {
    viewMode,
    setViewMode,
    showFavoritesOnly,
    toggleFavoritesFilter,
    favoriteIds,
    toggleFavorite,
    bulkToggle,
    displayed,
  }
}
