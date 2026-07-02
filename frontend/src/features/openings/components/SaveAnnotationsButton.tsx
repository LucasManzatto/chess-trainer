type Props = {
  text: string
  disabled?: boolean
  onSave: () => void
}

export function SaveAnnotationsButton({ text, disabled, onSave }: Props) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className="bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-50 border border-white/15 text-white/80 text-xs font-medium rounded px-3 py-1.5 transition-colors cursor-pointer"
    >
      {text}
    </button>
  )
}
