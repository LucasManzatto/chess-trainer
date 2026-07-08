import { useState } from 'react'
import { GearIcon } from '../../../../components/icons'
import type { BoardConfig } from '../../../../stores/board/boardSettingsStore'
import { FlipBoardButton } from '../settings/FlipBoardButton'
import { ShowThreatsButton } from '../settings/ShowThreatsButton'
import { ShowBestMoveButton } from '../settings/ShowBestMoveButton'
import { ResetBoardButton } from '../settings/ResetBoardButton'
import { CopyFenButton } from '../settings/CopyFenButton'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

export type ChessBoardSettingsProps = {
  config: BoardConfig
  fen: string
  onConfigChange: (updater: (prev: BoardConfig) => BoardConfig) => void
  onFlipOrientation: () => void
  onReset: () => void
}

export function ChessBoardSettings({
  config,
  fen,
  onConfigChange,
  onFlipOrientation,
  onReset,
}: ChessBoardSettingsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  function update<K extends keyof BoardConfig>(key: K, value: BoardConfig[K]) {
    onConfigChange(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="absolute top-0 left-full ml-1 flex flex-col gap-1 z-10">
      <Popover open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <Toggle
                    pressed={drawerOpen}
                    size="sm"
                    aria-label="Settings"
                    className="size-7 justify-center rounded-lg p-0 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white data-pressed:bg-black/60 data-pressed:text-white"
                  />
                }
              />
            }
          >
            <GearIcon size={14} />
          </TooltipTrigger>
          <TooltipContent side="left">Settings</TooltipContent>
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-48 p-3">
          <Label className="flex flex-col items-stretch gap-2">
            <span className="text-xs text-white/60">Board size</span>
            <input
              type="range"
              min={240}
              max={800}
              step={8}
              value={config.boardSize}
              onChange={e => update('boardSize', Number(e.target.value))}
              className="w-full accent-white/80"
            />
            <span className="text-xs text-white/40 text-right">{config.boardSize}px</span>
          </Label>
        </PopoverContent>
      </Popover>
      <FlipBoardButton onClick={onFlipOrientation} />
      <ShowThreatsButton active={config.showThreats} onClick={() => update('showThreats', !config.showThreats)} />
      <ShowBestMoveButton active={config.showBestMove} onClick={() => update('showBestMove', !config.showBestMove)} />
      <CopyFenButton fen={fen} />
      <ResetBoardButton onClick={onReset} />
    </div>
  )
}
