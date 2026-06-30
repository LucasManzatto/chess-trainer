import { EyeIcon } from '../../../../components/icons'

type Props = { active: boolean; onClick: () => void }

export function ShowThreatsButton({ active, onClick }: Props) {
  return (
    <button
      className={`p-1.5 rounded bg-black/40 hover:bg-black/60 transition-colors ${active ? 'text-white' : 'text-white/70 hover:text-white'}`}
      onClick={onClick}
      title={active ? 'Hide threats' : 'Show threats'}
    >
      <EyeIcon size={14} />
    </button>
  )
}
