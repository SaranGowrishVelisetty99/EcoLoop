# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> redirects to auth when not signed in
- Location: e2e\dashboard.spec.ts:8:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/auth/
Received string:  "http://localhost:3000/dashboard"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/dashboard"

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - region "Sign in required":
    - heading "Sign in to view your upcycling dashboard." [level=1]
    - paragraph: Authentication is required to load your scans, project progress, and sustainability metrics.
    - button "Go to sign-in"
    - button "Open scanner"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/dashboard');
  6  |   });
  7  | 
  8  |   test('redirects to auth when not signed in', async ({ page }) => {
> 9  |     await expect(page).toHaveURL(/\/auth/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  10 |   });
  11 | 
  12 |   test('shows welcome message when signed in', async ({ page }) => {
  13 |     // This would require a logged in user - skipped for now
  14 |     test.skip();
  15 |   });
  16 | });
  17 | 
  18 | test.describe('Scan Page', () => {
  19 |   test.beforeEach(async ({ page }) => {
  20 |     await page.goto('/dashboard/scan');
  21 |   });
  22 | 
  23 |   test('shows scan page', async ({ page }) => {
  24 |     await expect(page.locator('h1')).toContainText(/scan|camera|upload/i);
  25 |   });
  26 | });
  27 | 
  28 | test.describe('Leaderboard', () => {
  29 |   test.beforeEach(async ({ page }) => {
  30 |     await page.goto('/dashboard/leaderboard');
  31 |   });
  32 | 
  33 |   test('shows leaderboard page', async ({ page }) => {
  34 |     await expect(page.locator('h1')).toContainText(/leaderboard/i);
  35 |   });
  36 | });
  37 | 
  38 | test.describe('Account', () => {
  39 |   test.beforeEach(async ({ page }) => {
  40 |     await page.goto('/dashboard/account');
  41 |   });
  42 | 
  43 |   test('shows account page', async ({ page }) => {
  44 |     await expect(page.locator('h1')).toContainText(/account/i);
  45 |   });
  46 | });
```