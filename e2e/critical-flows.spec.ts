import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.describe('Complete Signup → Scan → Dashboard Flow', () => {
    test('new user can signup, scan an item, and see it on dashboard', async ({ page }) => {
      // 1. Sign up
      await page.goto('/auth');
      await page.click('text=Need an account? Sign up');
      await expect(page.locator('h2')).toContainText('Create account');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPass123!';
      
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.fill('input[placeholder="Confirm Password"]', testPassword);
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard after signup
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
      
      // 2. Go to scan page and upload an image
      await page.goto('/dashboard/scan');
      await expect(page.locator('h1')).toContainText(/scan|camera|upload/i);
      
      // Create a simple test image using canvas
      const testImagePath = await createTestImage(page);
      
      // Upload the test image
      await page.setInputFiles('input[type="file"]', testImagePath);
      
      // Wait for analysis to complete
      await expect(page.locator('text=Analysis completed')).toBeVisible({ timeout: 30000 });
      await expect(page.locator('text=Upcycling blueprint')).toBeVisible({ timeout: 10000 });
      
      // 3. Go back to dashboard and verify scan appears
      await page.goto('/dashboard');
      await expect(page.locator('text=Recent scan history')).toBeVisible();
      await expect(page.locator('text=Recent scan history').locator('..').locator('article').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Existing User Sign In → Dashboard → Leaderboard', () => {
    test('existing user can sign in and see their rank on leaderboard', async ({ page }) => {
      // This test assumes a test user exists
      // In real scenario, you'd seed the database first
      await page.goto('/auth');
      
      // Sign in with existing test user
      // Note: This test would need a seeded test user
      // Skipping for now as it requires test infrastructure
      test.skip('Requires seeded test user');
    });
  });

  test.describe('Scan → Project Creation → Dashboard Tracking', () => {
    test('user can scan, create project, and track progress', async ({ page }) => {
      // This would require an authenticated user
      // Skipping for now as it requires test infrastructure
      test.skip('Requires authenticated user and test infrastructure');
    });
  });
});

// Helper function to create a test image
async function createTestImage(page) {
  // Create a simple test image using canvas
  const imageData = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 25, 55);
    return canvas.toDataURL('image/png');
  });
  
  // Convert data URL to file
  const buffer = Buffer.from(imageData.split(',')[1], 'base64');
  const fs = require('fs');
  const path = require('path');
  const testImagePath = path.join(__dirname, '..', 'test-image.png');
  fs.writeFileSync(testImagePath, buffer);
  return testImagePath;
}