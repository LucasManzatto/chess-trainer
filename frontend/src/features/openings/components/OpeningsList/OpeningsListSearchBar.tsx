interface OpeningsListSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function OpeningsListSearchBar({ value, onChange }: OpeningsListSearchBarProps) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      <input
        type="text"
        placeholder="Search openings…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded-md px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
      />
    </div>
  )
}
