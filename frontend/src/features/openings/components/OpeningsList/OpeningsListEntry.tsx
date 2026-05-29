import { ListView } from './ListView'
import { NameView } from './NameView'
import { MoveView } from './MoveView'
import type { Opening } from '../../types'

type ViewMode = 'list' | 'name' | 'move'

interface OpeningsListEntryProps {
  viewMode: ViewMode
  openings: Opening[]
}

export function OpeningsListEntry({ viewMode, openings }: OpeningsListEntryProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {viewMode === 'list' && <ListView openings={openings} />}
      {viewMode === 'name' && <NameView openings={openings} />}
      {viewMode === 'move' && <MoveView openings={openings} />}
    </div>
  )
}
