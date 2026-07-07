import { FlipIcon } from '../../../../components/icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = { onClick: () => void }

export function FlipBoardButton({ onClick }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClick}
            aria-label="Flip board"
            className="bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
          />
        }
      >
        <FlipIcon size={14} />
      </TooltipTrigger>
      <TooltipContent side="left">Flip board</TooltipContent>
    </Tooltip>
  )
}
