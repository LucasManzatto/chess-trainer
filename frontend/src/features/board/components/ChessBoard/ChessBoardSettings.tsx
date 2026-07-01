import { useState } from 'react'
import type { BoardConfig } from '../../../../stores/board/boardSettingsStore'
import { SettingsDrawerButton } from '../settings/SettingsDrawerButton'
import { FlipBoardButton } from '../settings/FlipBoardButton'
import { ShowThreatsButton } from '../settings/ShowThreatsButton'
import { ShowBestMoveButton } from '../settings/ShowBestMoveButton'
import { ResetBoardButton } from '../settings/ResetBoardButton'
import { ResetAnnotationsButton } from '../settings/ResetAnnotationsButton'
import { BoardSizeDrawer } from '../settings/BoardSizeDrawer'

export type ChessBoardSettingsProps = {
  config: BoardConfig
  onConfigChange: (updater: (prev: BoardConfig) => BoardConfig) => void
  onFlipOrientation: () => void
  onReset: () => void
  annotationsDirty: boolean
  onResetAnnotations: () => void
}

export function ChessBoardSettings({
  config,
  onConfigChange,
  onFlipOrientation,
  onReset,
  annotationsDirty,
  onResetAnnotations,
}: ChessBoardSettingsProps) {
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
        <ResetBoardButton onClick={onReset} />
        <ResetAnnotationsButton onClick={onResetAnnotations} disabled={!annotationsDirty} />
      </div>
      <BoardSizeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} value={config.boardSize} onChange={size => update('boardSize', size)} />
    </>
  )
}
