export type EcoGroup = 'All' | 'A' | 'B' | 'C' | 'D' | 'E'
export const ECO_GROUPS: EcoGroup[] = ['All', 'A', 'B', 'C', 'D', 'E']

type Props = {
  ecoGroup: EcoGroup
  onChange: (g: EcoGroup) => void
}

export function EcoFilter({ ecoGroup, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {ECO_GROUPS.map(g => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`flex-1 text-xs py-1 rounded-md transition-colors ${
            ecoGroup === g
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}
