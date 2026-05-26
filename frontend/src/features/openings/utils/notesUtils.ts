export function moveLabel(moves: string[], index: number): string {
  const num = Math.floor(index / 2) + 1
  return index % 2 === 0 ? `${num}. ${moves[index]}` : `${num}... ${moves[index]}`
}
