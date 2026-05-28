import { useState } from 'react'
import { OpeningsListHeader } from './OpeningsList/OpeningsListHeader'
import { OpeningsListSearchBar } from './OpeningsList/OpeningsListSearchBar'
import { OpeningsListEntry } from './OpeningsList/OpeningsListEntry'
import { useOpeningsStore } from './store/openingsStore'

type ViewMode = 'list' | 'name' | 'move'

export function OpeningsListV2() {
  const [viewMode, setViewMode] = useState<ViewMode>('name')
  const openings = useOpeningsStore(s => s.openings)

  return (
    <div className="flex flex-col h-full">
      <OpeningsListHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      <OpeningsListSearchBar />
      <OpeningsListEntry viewMode={viewMode} openings={openings} />
    </div>
  )
}
