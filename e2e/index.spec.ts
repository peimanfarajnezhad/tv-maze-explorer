import { test, expect } from '@playwright/test'

test('index page loads and shows the app', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('main.container')).toBeVisible()
  await expect(page).toHaveTitle('TV Maze')
})
