import { test, expect } from '@playwright/test'

test('index page loads and shows the app', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('TV Maze')
  await expect(page.locator('main.container')).toBeVisible()
})
