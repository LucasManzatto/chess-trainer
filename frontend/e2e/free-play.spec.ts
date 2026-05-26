import { test, expect, type Page } from '@playwright/test'

// Compute click coordinates for a square on a white-oriented cg-board.
// Chessground uses CSS transforms based on position: col 0=a, row 0=rank1 (bottom).
async function clickSquare(page: Page, key: string) {
  const col = key.charCodeAt(0) - 97
  const row = key.charCodeAt(1) - 49
  const board = page.locator('cg-board')
  const box = await board.boundingBox()
  if (!box) throw new Error('cg-board not found')
  const sqW = box.width / 8
  const sqH = box.height / 8
  await board.click({ position: { x: (col + 0.5) * sqW, y: (7 - row + 0.5) * sqH } })
}

test.describe('Free Play', () => {
  test('board is visible on page load', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('cg-board')).toBeVisible()
  })

  test('white pawns are present at start', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('cg-board piece.white.pawn').first()).toBeVisible()
  })

  test('move e2-e4 appears in move list', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('cg-board piece.white.pawn').first()).toBeVisible()
    // Two-click move: first click selects e2, second click moves to e4
    await clickSquare(page, 'e2')
    await clickSquare(page, 'e4')
    // Move list table should contain a button with text "e4"
    await expect(page.locator('table button').filter({ hasText: /^e4$/ }).first()).toBeVisible()
  })
})
