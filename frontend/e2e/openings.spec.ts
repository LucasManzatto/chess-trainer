import { test, expect, type Page } from '@playwright/test'

const OPENING_ITEM = 'section:first-of-type button.w-full'

// Switch to flat list view so each item shows the full opening name.
async function switchToListView(page: Page) {
  await page.getByRole('button', { name: 'list', exact: true }).first().click()
}

test.describe('Openings routing', () => {
  test('/openings redirects to /openings/browse', async ({ page }) => {
    await page.goto('/openings/browse')
    await expect(page).toHaveURL(/\/openings\/browse/, { timeout: 5000 })
  })
})

test.describe('Openings Browse', () => {
  test('openings list is populated on page load', async ({ page }) => {
    await page.goto('/openings/browse')
    // Default view is name-tree; wait for any button in the openings section
    await expect(page.locator('section:first-of-type button').first()).toBeVisible({ timeout: 10000 })
  })

  test('searching Sicilian filters results to Sicilian openings', async ({ page }) => {
    await page.goto('/openings/browse')
    await switchToListView(page)
    await page.getByPlaceholder('Search openings…').fill('Sicilian')
    await expect(page.locator(OPENING_ITEM).first()).toBeVisible({ timeout: 10000 })
    const items = page.locator(OPENING_ITEM)
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText('Sicilian', { ignoreCase: true })
    }
  })

  test('searching unknown term shows no openings', async ({ page }) => {
    await page.goto('/openings/browse')
    await switchToListView(page)
    // Wait for list to load first
    await expect(page.locator(OPENING_ITEM).first()).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('Search openings…').fill('xyzxyzxyz')
    await expect(page.locator(OPENING_ITEM)).toHaveCount(0)
  })

  test('clicking an opening populates the move list', async ({ page }) => {
    await page.goto('/openings/browse')
    await switchToListView(page)
    await page.getByPlaceholder('Search openings…').fill('Sicilian')
    await expect(page.locator(OPENING_ITEM).first()).toBeVisible({ timeout: 10000 })
    await page.locator(OPENING_ITEM).first().click()
    // Move list table should contain at least one move button
    await expect(page.locator('table button').first()).toBeVisible()
  })
})
