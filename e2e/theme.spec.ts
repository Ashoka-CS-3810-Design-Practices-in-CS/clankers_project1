import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('light mode persists and keeps every workspace accessible', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Light mode' });
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
