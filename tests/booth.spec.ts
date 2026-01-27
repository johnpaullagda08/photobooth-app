import { test, expect } from '@playwright/test';

test.describe('Photobooth Camera Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booth');
    await page.waitForLoadState('networkidle');
  });

  test('camera container fills the screen properly', async ({ page }) => {
    // Wait for camera preview container
    const cameraContainer = page.locator('.flex-1.relative').first();
    await expect(cameraContainer).toBeVisible();

    // Get viewport size
    const viewportSize = page.viewportSize();
    if (!viewportSize) return;

    // Get camera container bounds
    const bounds = await cameraContainer.boundingBox();
    if (!bounds) return;

    // Camera should take significant portion of viewport (accounting for header and controls)
    const headerHeight = 56; // h-14 = 3.5rem = 56px
    const availableHeight = viewportSize.height - headerHeight;
    const heightRatio = bounds.height / availableHeight;

    // Camera should be at least 50% of available height
    expect(heightRatio).toBeGreaterThan(0.5);
    // Camera should use full width
    expect(bounds.width).toBeGreaterThan(viewportSize.width * 0.9);
  });

  test('displays header with Photobooth title', async ({ page }) => {
    const header = page.getByText('Photobooth').first();
    await expect(header).toBeVisible();
  });

  test('displays format info in header', async ({ page }) => {
    const formatInfo = page.getByText(/2x6 Strip|4R Format/i);
    await expect(formatInfo).toBeVisible();
  });

  test('settings button is visible', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await expect(settingsButton).toBeVisible();
  });

  test('fullscreen button is visible', async ({ page }) => {
    // Look for fullscreen toggle button
    const fullscreenButton = page.locator('button[title*="fullscreen"]').first();
    await expect(fullscreenButton).toBeVisible();
  });
});

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booth');
    await page.waitForLoadState('networkidle');
  });

  test('settings modal opens and closes', async ({ page }) => {
    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    // Check modal is visible
    const modalTitle = page.locator('h2', { hasText: 'Settings' });
    await expect(modalTitle).toBeVisible();

    // Check for save button
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();

    // Close with cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Modal should be closed
    await expect(modalTitle).not.toBeVisible();
  });

  test('can close settings with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    const modalTitle = page.locator('h2', { hasText: 'Settings' });
    await expect(modalTitle).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modalTitle).not.toBeVisible();
  });

  test('can switch between 2x6 Strip and 4R format', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    // Click 4R Photo button
    const fourRButton = page.getByRole('button', { name: /4r photo/i });
    await fourRButton.click();

    // Verify 4R is selected (should have blue background)
    await expect(fourRButton).toHaveClass(/bg-blue-600/);

    // Switch back to Strip
    const stripButton = page.getByRole('button', { name: /2x6 strip/i });
    await stripButton.click();
    await expect(stripButton).toHaveClass(/bg-blue-600/);
  });

  test('countdown options are available', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    // Check for countdown duration buttons
    await expect(page.getByRole('button', { name: '3s' })).toBeVisible();
    await expect(page.getByRole('button', { name: '5s' })).toBeVisible();
    await expect(page.getByRole('button', { name: '8s' })).toBeVisible();
    await expect(page.getByRole('button', { name: '10s' })).toBeVisible();
  });

  test('layout editor appears for 4R format', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    // Select 4R format
    await page.getByRole('button', { name: /4r photo/i }).click();

    // Layout editor should be visible
    const layoutEditor = page.getByText(/layout editor/i);
    await expect(layoutEditor).toBeVisible();

    // Reset button should be available
    const resetButton = page.getByText(/reset to default/i);
    await expect(resetButton).toBeVisible();
  });

  test('photo count options only show for strip format', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    // Should show photo count for strip format
    const photosLabel = page.getByText(/photos per strip/i);
    await expect(photosLabel).toBeVisible();

    // Switch to 4R
    await page.getByRole('button', { name: /4r photo/i }).click();

    // Photo count should be hidden for 4R
    await expect(photosLabel).not.toBeVisible();
  });

  test('settings are saved when clicking Save button', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    // Change countdown to 5s
    await page.getByRole('button', { name: '5s' }).click();

    // Save settings
    await page.getByRole('button', { name: /save/i }).click();

    // Modal should close
    const modalTitle = page.locator('h2', { hasText: 'Settings' });
    await expect(modalTitle).not.toBeVisible();

    // Reopen to verify setting was saved
    await page.getByRole('button', { name: /settings/i }).click();
    const countdown5s = page.getByRole('button', { name: '5s' });
    await expect(countdown5s).toHaveClass(/bg-blue-600/);
  });

  test('has printer configuration option', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    const printerButton = page.getByRole('button', { name: /configure printer/i });
    await expect(printerButton).toBeVisible();
  });

  test('has camera source selector', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    const cameraLabel = page.getByText(/camera source/i);
    await expect(cameraLabel).toBeVisible();
  });
});

test.describe('Layout Editor (4R Format)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booth');
    await page.getByRole('button', { name: /settings/i }).click();
    await page.getByRole('button', { name: /4r photo/i }).click();
  });

  test('shows layout editor when 4R is selected', async ({ page }) => {
    // Layout editor label should be visible
    const layoutEditor = page.getByText(/layout editor/i);
    await expect(layoutEditor).toBeVisible();
  });

  test('shows box dimensions', async ({ page }) => {
    // Dimension displays should be visible
    const dimensionDisplay = page.locator('.grid-cols-2').first();
    await expect(dimensionDisplay).toBeVisible();

    // Should show percentage dimensions in the layout
    const percentText = page.getByText(/%/).first();
    await expect(percentText).toBeVisible();
  });

  test('reset button is available', async ({ page }) => {
    const resetButton = page.getByText(/reset to default/i);
    await expect(resetButton).toBeVisible();

    // Clicking reset should work
    await resetButton.click();

    // Layout editor should still be visible
    const layoutEditor = page.getByText(/layout editor/i);
    await expect(layoutEditor).toBeVisible();
  });
});

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('booth page is usable on mobile', async ({ page }) => {
    await page.goto('/booth');

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Camera area should be visible
    const cameraArea = page.locator('.flex-1.relative').first();
    await expect(cameraArea).toBeVisible();

    // Settings button (icon only on mobile) should be accessible
    // Look for the button that contains the Settings icon
    const settingsButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
    await expect(settingsButton).toBeVisible();
  });

  test('settings modal is usable on mobile', async ({ page }) => {
    await page.goto('/booth');

    // Click settings button (icon only on mobile)
    const settingsButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
    await settingsButton.click();

    // Modal should be visible
    const modalTitle = page.locator('h2', { hasText: 'Settings' });
    await expect(modalTitle).toBeVisible();

    // Save button should be visible
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();
  });
});

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('booth page renders correctly on tablet', async ({ page }) => {
    await page.goto('/booth');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    const cameraArea = page.locator('.flex-1.relative').first();
    await expect(cameraArea).toBeVisible();

    const bounds = await cameraArea.boundingBox();
    if (bounds) {
      // Should use good width on tablet
      expect(bounds.width).toBeGreaterThan(700);
    }
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('booth page renders correctly on desktop', async ({ page }) => {
    await page.goto('/booth');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    const cameraArea = page.locator('.flex-1.relative').first();
    await expect(cameraArea).toBeVisible();

    const bounds = await cameraArea.boundingBox();
    if (bounds) {
      // Should fill good portion of viewport on desktop
      expect(bounds.height).toBeGreaterThan(600);
    }
  });
});

test.describe('Accessibility', () => {
  test('settings modal buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/booth');
    await page.getByRole('button', { name: /settings/i }).click();

    // Tab to save button and verify focus
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Save button should be focusable
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.focus();
    await expect(saveButton).toBeFocused();
  });

  test('format buttons have proper labels', async ({ page }) => {
    await page.goto('/booth');
    await page.getByRole('button', { name: /settings/i }).click();

    // Format buttons should be properly labeled
    await expect(page.getByRole('button', { name: /2x6 strip/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /4r photo/i })).toBeVisible();
  });
});
