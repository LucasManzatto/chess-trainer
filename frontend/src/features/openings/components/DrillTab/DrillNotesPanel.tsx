import { NotesPanel } from '../NotesPanel'

type Props = { openingId: number; moves: string[] }

export function DrillNotesPanel({ openingId, moves }: Props) {
  return (
    <div className="w-64 flex-shrink-0 border-l border-white/10 p-3 overflow-y-auto">
      <NotesPanel openingId={openingId} moveIndex={null} fen={undefined} moves={moves} />
    </div>
  )
}
