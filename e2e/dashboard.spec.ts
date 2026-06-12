import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('redirects to auth when not signed in', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth/);
  });

  test('shows welcome message when signed in', async ({ page }) => {
    // This would require a logged in user - skipped for now
    test.skip();
  });
});

test.describe('Scan Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/scan');
  });

  test('shows scan page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/scan|camera|upload/i);
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