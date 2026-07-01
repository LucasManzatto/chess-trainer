import type { MoveStatDisplay } from '../../../stores/board/boardSettingsStore'
import { WinrateIcon, FrequencyIcon } from '../../../../components/icons'

type Props = { value: MoveStatDisplay; onChange: (v: MoveStatDisplay) => void }

export function MoveStatDisplayButton({ value, onChange }: Props) {
  return (
    <button
      className="p-1.5 rounded bg-black/40 hover:bg-black/60 transition-colors text-white"
      onClick={() => onChange(value === 'winrate' ? 'frequency' : 'winrate')}
      title={value === 'winrate' ? 'Showing win rate — click for frequency' : 'Showing frequency — click for win rate'}
    >
      {value === 'winrate' ? <WinrateIcon size={14} /> : <FrequencyIcon size={14} />}
    </button>
  )
}
