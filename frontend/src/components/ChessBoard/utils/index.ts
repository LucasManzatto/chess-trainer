export function squareToPixel(
  square: string,
  boardSize: number,
  orientation: 'white' | 'black',
  dotSize: number,
) {
  const fileIdx = square.charCodeAt(0) - 97
  const rankIdx = parseInt(square[1]) - 1
  const sq = boardSize / 8
  const col = orientation === 'white' ? fileIdx : 7 - fileIdx
  const row = orientation === 'white' ? 7 - rankIdx : rankIdx
  return { left: col * sq + sq - dotSize - 2, top: row * sq + 2 }
}
