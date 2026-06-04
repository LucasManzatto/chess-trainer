import { useState, useMemo } from 'react'
import { OpeningsListHeader } from './OpeningsList/OpeningsListHeader'
import { OpeningsListSearchBar } from './OpeningsList/OpeningsListSearchBar'
import { OpeningsListEntry } from './OpeningsList/OpeningsListEntry'
import { useOpeningFavorites } from '../hooks/useOpeningFavorites'
import type { Opening } from '../types'

type Props = {
  openings: Opening[]
  search: string
  onSearchChange: (search: string) => void
}

export function OpeningsList({ openings, search, onSearchChange }: Props) {
  const [filterFavorites, setFilterFavorites] = useState(false)
  const { isFavorite } = useOpeningFavorites()

  const displayed = useMemo(() =>
    filterFavorites ? openings.filter(o => isFavorite(o.id)) : openings,
  [openings, filterFavorites, isFavorite])

  return (
    <div className="flex flex-col h-full">
      <OpeningsListHeader
        filterFavorites={filterFavorites}
        onFilterFavoritesChange={setFilterFavorites}
      />
      <OpeningsListSearchBar value={search} onChange={onSearchChange} />
      <OpeningsListEntry openings={displayed} />
    </div>
  )
}
