# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Critical User Flows >> Complete Signup → Scan → Dashboard Flow >> new user can signup, scan an item, and see it on dashboard
- Location: e2e\critical-flows.spec.ts:5:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="Confirm Password"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e4]:
    - region "Create account" [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]: EcoLoop Access
          - generic [ref=e9]:
            - heading [level=1] [ref=e10]: Sign in to manage upcycling projects and scans.
            - paragraph [ref=e11]: Secure Firebase Auth keeps your scan history and progress private. The dashboard shows aggregate carbon impact in real time.
          - generic [ref=e12]:
            - generic [ref=e13]:
              - img [ref=e14]
              - generic [ref=e17]: Firebase Auth + Firestore sync
            - generic [ref=e18]:
              - img [ref=e19]
              - generic [ref=e22]: OpenRouter scan analysis and blueprint generation
            - generic [ref=e23]:
              - img [ref=e24]
              - generic [ref=e27]: A sustainable dashboard for active and completed projects
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - paragraph [ref=e31]: Authentication
              - heading "Create account" [level=2] [ref=e32]
            - img [ref=e33]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - generic [ref=e38]: Email
              - textbox "Email" [ref=e39]: test-1781368239574@example.com
            - generic [ref=e40]:
              - generic [ref=e41]:
                - generic [ref=e42]: Password
                - textbox "Password" [active] [ref=e43]: TestPass123!
                - paragraph [ref=e44]: At least 6 characters
              - button "Show password" [ref=e45] [cursor=pointer]:
                - img [ref=e46]
            - generic [ref=e49]:
              - generic [ref=e50]:
                - generic [ref=e51]: Confirm Password
                - textbox "Confirm Password" [ref=e52]
              - button "Show password" [ref=e53] [cursor=pointer]:
                - img [ref=e54]
            - button "Create account" [ref=e57] [cursor=pointer]
          - button "Already have an account? Sign in" [ref=e59] [cursor=pointer]
          - paragraph [ref=e60]:
            - text: Need a quick route to the main workspace?
            - link "Open the dashboard" [ref=e61] [cursor=pointer]:
              - /url: /dashboard
            - text: .
  - button "Open Next.js Dev Tools" [ref=e67] [cursor=pointer]:
    - img [ref=e68]
  - alert [ref=e71]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Critical User Flows', () => {
  4  |   test.describe('Complete Signup → Scan → Dashboard Flow', () => {
  5  |     test('new user can signup, scan an item, and see it on dashboard', async ({ page }) => {
  6  |       // 1. Sign up
  7  |       await page.goto('/auth');
  8  |       await page.click('text=Need an account? Sign up');
  9  |       await expect(page.locator('h2')).toContainText('Create account');
  10 |       
  11 |       const testEmail = `test-${Date.now()}@example.com`;
  12 |       const testPassword = 'TestPass123!';
  13 |       
  14 |       await page.fill('input[type="email"]', testEmail);
  15 |       await page.fill('input[type="password"]', testPassword);
> 16 |       await page.fill('input[placeholder="Confirm Password"]', testPassword);
     |                  ^ Error: page.fill: Test timeout of 30000ms exceeded.
  17 |       await page.click('button[type="submit"]');
  18 |       
  19 |       // Should redirect to dashboard after signup
  20 |       await expect(page).toHaveURL(/\/dashboard/);
  21 |       await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  22 |       
  23 |       // 2. Go to scan page and upload an image
  24 |       await page.goto('/dashboard/scan');
  25 |       await expect(page.locator('h1')).toContainText(/scan|camera|upload/i);
  26 |       
  27 |       // Create a simple test image using canvas
  28 |       const testImagePath = await createTestImage(page);
  29 |       
  30 |       // Upload the test image
  31 |       await page.setInputFiles('input[type="file"]', testImagePath);
  32 |       
  33 |       // Wait for analysis to complete
  34 |       await expect(page.locator('text=Analysis completed')).toBeVisible({ timeout: 30000 });
  35 |       await expect(page.locator('text=Upcycling blueprint')).toBeVisible({ timeout: 10000 });
  36 |       
  37 |       // 3. Go back to dashboard and verify scan appears
  38 |       await page.goto('/dashboard');
  39 |       await expect(page.locator('text=Recent scan history')).toBeVisible();
  40 |       await expect(page.locator('text=Recent scan history').locator('..').locator('article').first()).toBeVisible({ timeout: 10000 });
  41 |     });
  42 |   });
  43 | 
  44 |   test.describe('Existing User Sign In → Dashboard → Leaderboard', () => {
  45 |     test('existing user can sign in and see their rank on leaderboard', async ({ page }) => {
  46 |       // This test assumes a test user exists
  47 |       // In real scenario, you'd seed the database first
  48 |       await page.goto('/auth');
  49 |       
  50 |       // Sign in with existing test user
  51 |       // Note: This test would need a seeded test user
  52 |       // Skipping for now as it requires test infrastructure
  53 |       test.skip('Requires seeded test user');
  54 |     });
  55 |   });
  56 | 
  57 |   test.describe('Scan → Project Creation → Dashboard Tracking', () => {
  58 |     test('user can scan, create project, and track progress', async ({ page }) => {
  59 |       // This would require an authenticated user
  60 |       // Skipping for now as it requires test infrastructure
  61 |       test.skip('Requires authenticated user and test infrastructure');
  62 |     });
  63 |   });
  64 | });
  65 | 
  66 | // Helper function to create a test image
  67 | async function createTestImage(page) {
  68 |   // Create a simple test image using canvas
  69 |   const imageData = await page.evaluate(() => {
  70 |     const canvas = document.createElement('canvas');
  71 |     canvas.width = 100;
  72 |     canvas.height = 100;
  73 |     const ctx = canvas.getContext('2d');
  74 |     ctx.fillStyle = '#4CAF50';
  75 |     ctx.fillRect(0, 0, 100, 100);
  76 |     ctx.fillStyle = '#FFF';
  77 |     ctx.font = '20px Arial';
  78 |     ctx.fillText('TEST', 25, 55);
  79 |     return canvas.toDataURL('image/png');
  80 |   });
  81 |   
  82 |   // Convert data URL to file
  83 |   const buffer = Buffer.from(imageData.split(',')[1], 'base64');
  84 |   const fs = require('fs');
  85 |   const path = require('path');
  86 |   const testImagePath = path.join(__dirname, '..', 'test-image.png');
  87 |   fs.writeFileSync(testImagePath, buffer);
  88 |   return testImagePath;
  89 | }
```