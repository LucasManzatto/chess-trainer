import { useState, useEffect, useRef } from 'react'
import { DEFAULT_BOARD_SIZE } from '../../stores/useBoardSettingsStore'

export function useBoardSizing(boardWidth?: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(DEFAULT_BOARD_SIZE)

  useEffect(() => {
    if (boardWidth !== undefined) return
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [boardWidth])

  return { containerRef, width: boardWidth ?? containerWidth }
}
