import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

type Props = {
  candidateMoves: Map<string, number>
}

export function ContinuationsList({ candidateMoves }: Props) {
  const sorted = useMemo(
    () => [...candidateMoves.entries()].sort((a, b) => b[1] - a[1]),
    [candidateMoves],
  )

  if (candidateMoves.size === 0) return null

  return (
    <div className="border-b border-border">
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Continuations</div>
      <ScrollArea className="max-h-40">
        {sorted.map(([san, count]) => (
          <div key={san} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-muted/50">
            <span className="font-mono text-foreground">{san}</span>
            <Badge variant="secondary">{count}</Badge>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
