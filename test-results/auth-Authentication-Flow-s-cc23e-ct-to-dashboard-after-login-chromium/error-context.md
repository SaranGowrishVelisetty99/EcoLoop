# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should redirect to dashboard after login
- Location: e2e\auth.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/auth"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/auth"

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - region "Welcome back":
    - paragraph: Authentication
    - heading "Welcome back" [level=2]
    - text: Email
    - textbox "Email" [disabled]: test@ecoloop.com
    - text: Password
    - textbox "Password" [disabled]: password123
    - button "Show password"
    - button "Sign in" [disabled]
    - button "Need an account? Sign up"
    - paragraph:
      - text: Need a quick route to the main workspace?
      - link "Open the dashboard":
        - /url: /dashboard
      - text: .
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should redirect to dashboard after login', async ({ page }) => {
  5  |     await page.goto('/auth');
  6  |     
  7  |     // Assuming a test account exists or emulator is used
  8  |     await page.fill('input[type="email"]', 'test@ecoloop.com');
  9  |     await page.fill('input[type="password"]', 'password123');
  10 |     await page.click('button[type="submit"]');
  11 |     
> 12 |     await expect(page).toHaveURL(/.*dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  13 |     await expect(page.locator('h1')).toContainText('Track scans');
  14 |   });
  15 | });
```