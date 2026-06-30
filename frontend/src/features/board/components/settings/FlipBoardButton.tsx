import { FlipIcon } from '../../../../components/icons'

type Props = { onClick: () => void }

export function FlipBoardButton({ onClick }: Props) {
  return (
    <button
      className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
      onClick={onClick}
      title="Flip board"
    >
      <FlipIcon size={14} />
    </button>
  )
}
