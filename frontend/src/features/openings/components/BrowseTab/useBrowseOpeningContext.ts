import { useMemo } from 'react'
import { useOpeningTrie, walkTrie, collectOpenings } from '../../hooks/useOpeningTrie'
import type { Opening } from '../../types'

export function useBrowseOpeningContext(
  openings: Opening[] | undefined,
  currentMoves: string[],
) {
  const trie = useOpeningTrie(openings)

  const currentNode = useMemo(() => {
    if (!trie) return null
    return walkTrie(trie, currentMoves)
  }, [trie, currentMoves])

  const matchingOpenings = useMemo((): Opening[] => {
    if (!currentNode) return []
    return collectOpenings(currentNode)
  }, [currentNode])

  const exactMatch: Opening | null = currentNode?.openings[0] ?? null
  const selected: Opening | null = exactMatch ?? matchingOpenings[0] ?? null

  const candidateMoves = useMemo((): Map<string, number> => {
    if (!currentNode) return new Map()
    const result = new Map<string, number>()
    for (const [san, child] of currentNode.children.entries()) {
      result.set(san, child.count)
    }
    return result
  }, [currentNode])

  return {
    matchingOpenings,
    exactMatch,
    selected,
    candidateMoves,
  }
}
