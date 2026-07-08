import { useState } from 'react'
import { CopyIcon } from '../../../../components/icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = { fen: string }

export function CopyFenButton({ fen }: Props) {
  const [copied, setCopied] = useState(false)

  function onClick() {
    void navigator.clipboard.writeText(fen)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClick}
            aria-label="Copy FEN"
            className="bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
          />
        }
      >
        <CopyIcon size={14} />
      </TooltipTrigger>
      <TooltipContent side="left">{copied ? 'Copied!' : 'Copy FEN'}</TooltipContent>
    </Tooltip>
  )
}
