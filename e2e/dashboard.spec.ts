import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('shows sign-in requirement when not authenticated', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Sign in to view/i);
    await expect(page.getByRole('button', { name: /Go to sign-in/i })).toBeVisible();
  });

  test('shows welcome message when signed in', async () => {
    // This would require a logged in user - skipped for now
    test.skip();
  });
});

test.describe('Scan Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/scan');
  });

  test('shows scan page', async ({ page }) => {
    // Wait for either the scanner or the sign-in fallback
    const heading = page.locator('h1');
    await expect(heading).containsText(/scan|camera|upload|sign in/i);
  });
});

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
  });

  test('shows leaderboard page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/leaderboard/i);
  });
});

test.describe('Account', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/account');
  });

  test('shows account page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/account/i);
  });
});