import { ResetIcon } from '../../../../components/icons'

type Props = { onClick: () => void; disabled?: boolean }

export function ResetAnnotationsButton({ onClick, disabled }: Props) {
  return (
    <button
      className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-black/40"
      onClick={onClick}
      disabled={disabled}
      title="Reset annotations"
    >
      <ResetIcon size={14} />
    </button>
  )
}
