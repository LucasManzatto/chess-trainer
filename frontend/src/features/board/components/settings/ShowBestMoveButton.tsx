import { BestMoveIcon } from '../../../../components/icons'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = { active: boolean; onClick: () => void }

export function ShowBestMoveButton({ active, onClick }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            pressed={active}
            onPressedChange={onClick}
            size="sm"
            aria-label={active ? 'Hide best move' : 'Show best move'}
            className="size-7 justify-center rounded-lg p-0 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white data-pressed:bg-black/60 data-pressed:text-white"
          />
        }
      >
        <BestMoveIcon size={14} />
      </TooltipTrigger>
      <TooltipContent side="left">{active ? 'Hide best move' : 'Show best move'}</TooltipContent>
    </Tooltip>
  )
}
