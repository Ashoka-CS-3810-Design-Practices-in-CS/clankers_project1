import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('enqueues, peeks, inspects, dequeues, switches, and resets a queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Queue workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Queue', exact: true })).toBeVisible();

  const input = page.getByLabel('Queue value');
  await input.fill('13');
  await page.getByRole('button', { name: 'Enqueue', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current queue contains 1 item')).toBeVisible();

  await input.fill('21');
  await page.getByRole('button', { name: 'Enqueue', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current queue contains 2 items')).toBeVisible();

  await page.getByRole('button', { name: 'Peek front', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Queue output')).toHaveText('13');

  await page.getByRole('button', { name: 'Inspect all' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Queue output')).toHaveText('1321');

  await page.getByRole('button', { name: 'Dequeue', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Queue output')).toHaveText('13');
  await expect(page.getByLabel('Current queue contains 1 item')).toBeVisible();

  await page.getByRole('button', { name: 'Stack, ready' }).click();
  await page.getByRole('button', { name: 'Queue, ready', exact: true }).click();
  await expect(page.getByLabel('Current queue contains 1 item')).toBeVisible();

  await page.getByRole('button', { name: 'Reset queue' }).click();
  await expect(page.getByText('Your queue is empty')).toBeVisible();
});
