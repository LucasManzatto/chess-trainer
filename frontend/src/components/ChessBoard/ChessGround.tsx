import { useEffect, useRef } from 'react'
import { Chessground } from '@lichess-org/chessground'
import type { Api } from '@lichess-org/chessground/api'
import type { Config } from '@lichess-org/chessground/config'

type Props = {
  config: Config
  width: number
}

export function ChessGround({ config, width }: Props) {
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

  return <div ref={elRef} style={{ width, height: width }} />
}
