interface OpeningsListSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function OpeningsListSearchBar({ value, onChange }: OpeningsListSearchBarProps) {
  return (
    <div className="px-3 py-2.5 border-b border-white/[0.08]">
      <input
        type="text"
        placeholder="Search openings…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.06] text-sm text-white/80 placeholder-white/20 rounded-md px-3 py-1.5 border border-white/[0.08] focus:outline-none focus:border-amber-400/40 transition-colors"
      />
    </div>
  )
}
