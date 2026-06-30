import { useState } from 'react'
import type { BoardConfig } from './store/boardSettingsStore'
import { SettingsDrawerButton } from './components/settings/SettingsDrawerButton'
import { FlipBoardButton } from './components/settings/FlipBoardButton'
import { ShowThreatsButton } from './components/settings/ShowThreatsButton'
import { ShowBestMoveButton } from './components/settings/ShowBestMoveButton'
import { MoveStatDisplayButton } from './components/settings/MoveStatDisplayButton'
import { ResetBoardButton } from './components/settings/ResetBoardButton'
import { BoardSizeDrawer } from './components/settings/BoardSizeDrawer'

export type ChessBoardSettingsProps = {
  config: BoardConfig
  onConfigChange: (updater: (prev: BoardConfig) => BoardConfig) => void
  onFlipOrientation: () => void
  onReset: () => void
}

export function ChessBoardSettings({ config, onConfigChange, onFlipOrientation, onReset }: ChessBoardSettingsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  function update<K extends keyof BoardConfig>(key: K, value: BoardConfig[K]) {
    onConfigChange(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <div className="absolute top-0 left-full ml-1 flex flex-col gap-1 z-10">
        <SettingsDrawerButton active={drawerOpen} onClick={() => setDrawerOpen(o => !o)} />
        <FlipBoardButton onClick={onFlipOrientation} />
        <ShowThreatsButton active={config.showThreats} onClick={() => update('showThreats', !config.showThreats)} />
        <ShowBestMoveButton active={config.showBestMove} onClick={() => update('showBestMove', !config.showBestMove)} />
        <MoveStatDisplayButton value={config.moveStatDisplay} onChange={val => update('moveStatDisplay', val)} />
        <ResetBoardButton onClick={onReset} />
      </div>
      <BoardSizeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} value={config.boardSize} onChange={size => update('boardSize', size)} />
    </>
  )
}
