import { useEffect, useRef } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'
import type { DrawShape } from '@lichess-org/chessground/draw'

type Props = {
  config: Config
  width: number
  autoShapes?: DrawShape[]
}

export function ChessGround({ config, width, autoShapes }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const initConfigRef = useRef(config)

  useEffect(() => {
    if (!elRef.current) return
    apiRef.current = Chessground(elRef.current, initConfigRef.current)
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    apiRef.current?.set(config)
  }, [config])

  // Use dedicated API method to avoid configure() race with drawable SVG init
  useEffect(() => {
    apiRef.current?.setAutoShapes(autoShapes ?? [])
  }, [autoShapes])

  return <div ref={elRef} style={{ width, height: width }} />
}
