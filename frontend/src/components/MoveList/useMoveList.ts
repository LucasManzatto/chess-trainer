import { useRef, useEffect } from 'react'

export function useMoveList(moves: string[], selectedIndex: number | null) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const tokenRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  useEffect(() => {
    if (selectedIndex === null) return
    tokenRefs.current[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedIndex])

  const pairs = Array.from(
    { length: Math.ceil(moves.length / 2) },
    (_, i) => [moves[i * 2], moves[i * 2 + 1]] as [string, string | undefined],
  )

  return { bottomRef, tokenRefs, pairs }
}
