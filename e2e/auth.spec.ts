import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to dashboard after login', async ({ page }) => {
    await page.goto('/auth');
    
    // Assuming a test account exists or emulator is used
    await page.fill('input[type="email"]', 'test@ecoloop.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Track scans');
  });
});