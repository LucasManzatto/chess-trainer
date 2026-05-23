import { useMemo } from 'react'
import type { Opening } from '../types'

export type TrieNode = {
  children: Map<string, TrieNode>
  openings: Opening[]
  count: number
}

function buildTrie(openings: Opening[]): TrieNode {
  const root: TrieNode = { children: new Map(), openings: [], count: 0 }

  for (const opening of openings) {
    let node = root
    node.count++
    for (const move of opening.moves) {
      let child = node.children.get(move)
      if (!child) {
        child = { children: new Map(), openings: [], count: 0 }
        node.children.set(move, child)
      }
      child.count++
      node = child
    }
    node.openings.push(opening)
  }

  return root
}

export function useOpeningTrie(openings: Opening[] | undefined): TrieNode | null {
  return useMemo(() => {
    if (!openings) return null
    return buildTrie(openings)
  }, [openings])
}

export function walkTrie(root: TrieNode, moves: string[]): TrieNode | null {
  let node: TrieNode = root
  for (const move of moves) {
    const next = node.children.get(move)
    if (!next) return null
    node = next
  }
  return node
}

export function collectOpenings(node: TrieNode): Opening[] {
  const result: Opening[] = []
  function dfs(n: TrieNode) {
    result.push(...n.openings)
    for (const child of n.children.values()) dfs(child)
  }
  dfs(node)
  return result
}
