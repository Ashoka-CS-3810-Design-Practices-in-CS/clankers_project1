import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('inserts, traverses, searches, deletes, switches, and resets a tree', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Binary Search Tree workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'Binary Search Tree', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByLabel('Current tree contains 7 nodes')).toBeVisible();

  await page.getByRole('button', { name: 'Inorder' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Traversal and result output')).toHaveText('20304050607080');

  const input = page.getByLabel('Tree node value');
  await input.fill('60');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Traversal and result output')).toHaveText('60');

  await page.getByRole('button', { name: 'Insert', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByText('×2', { exact: true })).toBeVisible();

  await input.fill('50');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current tree contains 6 nodes')).toBeVisible();

  await page.getByRole('button', { name: 'Queue, ready', exact: true }).click();
  await page.getByRole('button', { name: 'Binary Search Tree, ready' }).click();
  await expect(page.getByLabel('Current tree contains 6 nodes')).toBeVisible();

  await page.getByRole('button', { name: 'Reset tree' }).click();
  await expect(page.getByText('Your tree is empty')).toBeVisible();
});
