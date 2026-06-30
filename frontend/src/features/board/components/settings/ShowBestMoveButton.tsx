import { BestMoveIcon } from '../../../../components/icons'

type Props = { active: boolean; onClick: () => void }

export function ShowBestMoveButton({ active, onClick }: Props) {
  return (
    <button
      className={`p-1.5 rounded bg-black/40 hover:bg-black/60 transition-colors ${active ? 'text-white' : 'text-white/70 hover:text-white'}`}
      onClick={onClick}
      title={active ? 'Hide best move' : 'Show best move'}
    >
      <BestMoveIcon size={14} />
    </button>
  )
}
