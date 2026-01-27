import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Photobooth/i);
  });

  test('displays hero section with heading', async ({ page }) => {
    const heading = page.locator('h1', { hasText: 'Photobooth' });
    await expect(heading).toBeVisible();
  });

  test('displays tagline', async ({ page }) => {
    const tagline = page.getByText(/Create stunning photo strips/i);
    await expect(tagline).toBeVisible();
  });

  test('has Start Photobooth button that navigates to booth', async ({ page }) => {
    const startButton = page.getByRole('link', { name: /Start Photobooth/i });
    await expect(startButton).toBeVisible();

    await startButton.click();
    await expect(page).toHaveURL('/booth');
  });

  test('displays all 6 feature cards', async ({ page }) => {
    const features = [
      'Multiple Camera Sources',
      'Filters & Effects',
      'Custom Themes',
      'Easy Export',
      'Print Support',
      'Fully Responsive',
    ];

    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test('has Launch Photobooth CTA button', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /Launch Photobooth/i });
    await expect(ctaButton).toBeVisible();

    await ctaButton.click();
    await expect(page).toHaveURL('/booth');
  });

  test('displays footer with tech stack info', async ({ page }) => {
    const footer = page.getByText(/Built with Next.js/i);
    await expect(footer).toBeVisible();
  });
});
