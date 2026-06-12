import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('shows sign in form by default', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('can toggle to sign up', async ({ page }) => {
    await page.click('text=Need an account? Sign up');
    await expect(page.locator('h2')).toContainText('Create account');
  });

  test('shows error on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email')).toBeVisible();
  });

  test('sign up shows confirm password field', async ({ page }) => {
    await page.click('text=Need an account? Sign up');
    await expect(page.locator('input[placeholder="Confirm Password"]')).toBeVisible();
  });

  test('password mismatch shows error', async ({ page }) => {
    await page.click('text=Need an account? Sign up');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder="Confirm Password"]', 'different');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});