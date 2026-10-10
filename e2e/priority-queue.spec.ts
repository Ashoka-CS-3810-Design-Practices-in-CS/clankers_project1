import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('inserts, peeks, extracts, switches, and resets a priority queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Priority Queue, ready' }).click();
  await expect(page.getByRole('heading', { name: 'Priority Queue', exact: true })).toBeVisible();

  const input = page.getByLabel('Priority value');
  for (const value of ['9', '4', '7', '1']) {
    await input.fill(value);
    await page.getByRole('button', { name: 'Insert', exact: true }).click();
    await finishOperation(page);
  }
  await expect(page.getByLabel('Current priority queue contains 4 items')).toBeVisible();

  await page.getByRole('button', { name: 'Peek min', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Priority queue output')).toHaveText('1');

  await page.getByRole('button', { name: 'Extract min', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Priority queue output')).toHaveText('1');
  await expect(page.getByLabel('Current priority queue contains 3 items')).toBeVisible();

  await page.getByRole('button', { name: 'Extract min', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Priority queue output')).toHaveText('4');

  await page.getByRole('button', { name: 'Stack, ready' }).click();
  await page.getByRole('button', { name: 'Priority Queue, ready' }).click();
  await expect(page.getByLabel('Current priority queue contains 2 items')).toBeVisible();

  await page.getByRole('button', { name: 'Reset priority queue' }).click();
  await expect(page.getByText('Your priority queue is empty')).toBeVisible();
});
