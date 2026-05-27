interface OpeningsListFilterProps {
  search: string
  onSearchChange: (value: string) => void
}

export function OpeningsListFilter({ search, onSearchChange }: OpeningsListFilterProps) {
  return (
    <div className="px-3 pb-2">
      <input
        type="text"
        placeholder="Search openings…"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded-md px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
      />
    </div>
  )
}
