import { test, expect } from '@playwright/test'

const baseUrl:String = 'http://localhost:3000'

test('Can be accessed from "/collective/contribute" (default)', async ({ page }) => {
  await page.goto(baseUrl+'/apex/contribute')
  await expect(page).toHaveTitle('Contribute to APEX - Open Collective')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',baseUrl+'/apex/contribute')
})

test('Can be accessed from "/collective/tiers"', async ({ page }) => {
  await page.goto(baseUrl+'/apex/tiers')
  await expect(page).toHaveTitle('Contribute to APEX - Open Collective')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',baseUrl+'/apex/contribute')
})
