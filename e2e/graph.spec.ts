import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('builds a graph, runs BFS and DFS, edits it, and resets', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Graph workspace' }).click();
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

test('practice mode asks three BFS questions and scores them', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Graph workspace' }).click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('checkbox', { name: 'Practice mode' }).check();
  await main.getByRole('button', { name: 'Load sample' }).click();
  await main.getByLabel('Vertex', { exact: true }).fill('1');
  await main.getByRole('button', { name: 'BFS', exact: true }).click();
  await main.getByRole('button', { name: 'Play' }).click();

  await expect(main.getByRole('heading', { name: 'Predict the next step' })).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((violation) => violation.id)).toEqual([]);

  let answered = 0;
  for (let guard = 0; guard < 40; guard += 1) {
    if (await main.getByRole('heading', { name: 'Predict the next step' }).isVisible()) {
      await main.locator('.practice-option').first().click();
      await main.getByRole('button', { name: 'Show the step' }).click();
      answered += 1;
    } else if (await main.getByRole('button', { name: 'Next' }).isEnabled()) {
      await main.getByRole('button', { name: 'Next' }).click();
    } else {
      break;
    }
  }
  expect(answered).toBe(3);
  await expect(main.getByText('The queue is empty. BFS visited 1, 2, 3, 4, 5, 6.')).toBeVisible();
  await expect(main.getByText(/Score: \d of 3 correct/)).toBeVisible();
});
