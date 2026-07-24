import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { OpeningBranch } from '../types'

type Props = {
  openingName?: string | null
  isExact?: boolean
  className?: string
  branches?: OpeningBranch[]
}

export function PositionName({ openingName, isExact = true, className, branches = [] }: Props) {
  const handleClick = () => {
    if (openingName) {
      navigator.clipboard.writeText(openingName).catch(err => {
        console.error('Failed to copy opening name', err)
      })
    }
  }

  const nameSpan = (
    <span
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      role={openingName ? 'button' : undefined}
      tabIndex={openingName ? 0 : undefined}
      className={`${className ?? 'text-lg font-medium tracking-wide text-white/60 truncate select-none'} ${isExact ? '' : 'italic text-white/40'} ${openingName ? 'cursor-pointer' : ''}`}
    >
      {!isExact && openingName ? `≈ ${openingName}` : openingName}
    </span>
  )

  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {openingName ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={nameSpan} />
            <TooltipContent>Click to copy</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        nameSpan
      )}
      {branches.length > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <Badge variant="secondary" className="cursor-pointer">
                +{branches.length}
              </Badge>
            }
          />
          <PopoverContent className="w-auto max-w-sm max-h-(--available-height) overflow-y-auto">
            <ul className="flex flex-col gap-2">
              {branches.map((branch, i) => (
                <li key={branch.eco + branch.name}>
                  {branch.first_move !== branches[i - 1]?.first_move && (
                    <>
                      {i > 0 && <Separator className="mb-2" />}
                      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        {branch.first_move}
                      </div>
                    </>
                  )}
                  <div className="text-xs">
                    <span className="text-white/40">{branch.continuation}</span>
                    {' — '}
                    <span className="text-white/90">{branch.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </span>
  )
}
