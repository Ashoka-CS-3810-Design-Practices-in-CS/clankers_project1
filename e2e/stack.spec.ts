import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('pushes, peeks, inspects, pops, switches, and resets a stack', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Stack workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Stack', exact: true })).toBeVisible();

  const input = page.getByLabel('Item value');
  await input.fill('13');
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current stack contains 1 item')).toBeVisible();

  await input.fill('21');
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current stack contains 2 items')).toBeVisible();

  await page.getByRole('button', { name: 'Peek', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Operation output')).toHaveText('21');

  await page.getByRole('button', { name: 'Inspect all' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Operation output')).toHaveText('2113');

  await page.getByRole('button', { name: 'Pop', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current stack contains 1 item')).toBeVisible();

  await page.getByRole('button', { name: 'Linked List, ready' }).click();
  await page.getByRole('button', { name: 'Stack, ready' }).click();
  await expect(page.getByLabel('Current stack contains 1 item')).toBeVisible();

  await page.getByRole('button', { name: 'Reset stack' }).click();
  await expect(page.getByText('Your stack is empty')).toBeVisible();
});
