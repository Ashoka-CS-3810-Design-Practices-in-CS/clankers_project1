import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('zoom controls have visible keyboard focus in both themes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Linked List workspace' }).click();
  const zoomIn = page.getByRole('button', { name: 'Zoom in visualization' });
  const zoomOut = page.getByRole('button', { name: 'Zoom out visualization' });
  const reset = page.getByRole('button', { name: 'Reset visualization zoom to 100 percent' });

  for (const theme of ['dark', 'light']) {
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await zoomOut.focus();
    await zoomOut.press('Tab');
    await expect(zoomIn).toBeFocused();
    await zoomIn.press('Enter');
    for (const button of [zoomIn, reset, zoomOut]) {
      await expect(button).toBeFocused();
      await expect(button).toHaveCSS('outline-style', 'solid');
      await expect(button).toHaveCSS('outline-width', '3px');
      await expect(button).toHaveCSS('outline-color', 'rgb(36, 41, 35)');
      await button.press('Shift+Tab');
    }
    await reset.click();
    await page.getByTestId('theme-toggle').click();
  }
});

test('light mode persists and keeps every workspace accessible', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByTestId('theme-toggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const audit = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: 'Open Linked List workspace' }).click();
  for (const name of [
    'Linked List',
    'Stack',
    'Queue',
    'Binary Search Tree',
    'Priority Queue',
    'Graph',
  ]) {
    await page
      .getByRole('navigation')
      .getByRole('button', { name: new RegExp(`^${name},`) })
      .click();
    await page.getByRole('button', { name: 'Load sample' }).click();
    await audit();
  }
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByLabel('Current graph contains 6 vertices and 7 edges')).toBeVisible();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
