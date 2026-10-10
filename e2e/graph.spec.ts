import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('builds a graph, runs BFS and DFS, edits it, and resets', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Graph, ready', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Graph', exact: true })).toBeVisible();

  const vertex = page.getByLabel('Vertex', { exact: true });
  const target = page.getByLabel('Second vertex (edges)');
  for (const label of ['1', '2', '3']) {
    await vertex.fill(label);
    await page.getByRole('button', { name: 'Add vertex', exact: true }).click();
    await finishOperation(page);
  }
  for (const [from, to] of [
    ['1', '2'],
    ['1', '3'],
  ]) {
    await vertex.fill(from);
    await target.fill(to);
    await page.getByRole('button', { name: 'Add edge', exact: true }).click();
    await finishOperation(page);
  }
  await expect(page.getByLabel('Current graph contains 3 vertices and 2 edges')).toBeVisible();

  await vertex.fill('2');
  await page.getByRole('button', { name: 'BFS', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Visit order')).toHaveText('213');

  await page.getByRole('button', { name: 'DFS', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Visit order')).toHaveText('213');

  await vertex.fill('1');
  await target.fill('3');
  await page.getByRole('button', { name: 'Remove edge', exact: true }).click();
  await finishOperation(page);
  await expect(page.getByLabel('Current graph contains 3 vertices and 1 edge')).toBeVisible();

  await page.getByRole('button', { name: 'Queue, ready', exact: true }).click();
  await page.getByRole('button', { name: 'Graph, ready', exact: true }).click();
  await expect(page.getByLabel('Current graph contains 3 vertices and 1 edge')).toBeVisible();

  await page.getByRole('button', { name: 'Reset graph' }).click();
  await expect(page.getByText('Your graph is empty')).toBeVisible();
});
