import { ListView } from './ListView'
import type { Opening } from '../../types'

interface OpeningsListEntryProps {
  openings: Opening[]
}

export function OpeningsListEntry({ openings }: OpeningsListEntryProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <ListView openings={openings} />
    </div>
  )
}
