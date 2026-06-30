import { CloseIcon } from '../../../../components/icons'

type Props = { open: boolean; onClose: () => void; value: number; onChange: (v: number) => void }

export function BoardSizeDrawer({ open, onClose, value, onChange }: Props) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div className="absolute top-0 right-0 bottom-0 w-48 bg-gray-900/95 border-l border-white/10 pointer-events-auto flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-xs font-medium text-white/80">Settings</span>
          <button className="text-white/50 hover:text-white transition-colors" onClick={onClose}>
            <CloseIcon size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs text-white/60">Board size</span>
            <input
              type="range"
              min={240}
              max={800}
              step={8}
              value={value}
              onChange={e => onChange(Number(e.target.value))}
              className="w-full accent-white/80"
            />
            <span className="text-xs text-white/40 text-right">{value}px</span>
          </label>
        </div>
      </div>
    </div>
  )
}
