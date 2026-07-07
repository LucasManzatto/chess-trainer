import { ResetIcon } from '../../../../components/icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = { onClick: () => void }

export function ResetBoardButton({ onClick }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClick}
            aria-label="Reset board"
            className="bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
          />
        }
      >
        <ResetIcon size={14} />
      </TooltipTrigger>
      <TooltipContent side="left">Reset board</TooltipContent>
    </Tooltip>
  )
}
