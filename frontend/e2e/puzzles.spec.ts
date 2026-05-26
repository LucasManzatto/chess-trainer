import { test, expect } from '@playwright/test'

test.describe('Puzzles', () => {
  test('puzzles page loads with heading', async ({ page }) => {
    await page.goto('/puzzles')
    await expect(page.getByRole('heading', { name: 'Puzzles' })).toBeVisible()
  })

  test('no error boundary fallback visible', async ({ page }) => {
    await page.goto('/puzzles')
    await expect(page.getByText('Something went wrong')).not.toBeVisible()
  })
})
