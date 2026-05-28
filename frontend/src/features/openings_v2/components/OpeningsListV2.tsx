import { useState } from 'react'
import { OpeningsListHeader } from './OpeningsList/OpeningsListHeader'
import { OpeningsListSearchBar } from './OpeningsList/OpeningsListSearchBar'
import { OpeningsListEntry } from './OpeningsList/OpeningsListEntry'
import type { Opening } from '../../openings/types'

type ViewMode = 'list' | 'name' | 'move'

type Props = {
  openings: Opening[]
  search: string
  onSearchChange: (search: string) => void
}

export function OpeningsListV2({ openings, search, onSearchChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('name')

  return (
    <div className="flex flex-col h-full">
      <OpeningsListHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      <OpeningsListSearchBar value={search} onChange={onSearchChange} />
      <OpeningsListEntry viewMode={viewMode} openings={openings} />
    </div>
  )
}
