import { useBoardSizing } from './useBoardSizing'
import { ChessGround } from './ChessGround'
import { useBoardSettingsStore } from '../../stores/useBoardSettingsStore'
import type { MoveResult, GameOverResult } from './types'
import type { Config } from '@lichess-org/chessground/config'
import type { DrawShape } from '@lichess-org/chessground/draw'

export type { MoveResult, GameOverResult }

export type ChessBoardProps = {
  config: Config
  boardWidth?: number
  extraShapes?: DrawShape[]
}

export function ChessBoard({ config, boardWidth, extraShapes }: ChessBoardProps) {
  const { size: storedSize } = useBoardSettingsStore()
  const resolvedWidth = boardWidth ?? storedSize
  const { containerRef, width } = useBoardSizing(resolvedWidth)

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <ChessGround config={config} width={width} autoShapes={extraShapes} />
    </div>
  )
}
