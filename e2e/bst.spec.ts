import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('inserts, traverses, searches, deletes, switches, and resets a tree', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Binary Search Tree, ready' }).click();
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

test('practice mode asks three BST search questions and scores them', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Data structures' })
    .getByRole('button', { name: /^Binary Search Tree,/ })
    .click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('checkbox', { name: 'Practice mode' }).check();
  await main.getByRole('button', { name: 'Load sample' }).click();
  await main.getByLabel('Tree node value').fill('60');
  await main.getByRole('button', { name: 'Search', exact: true }).click();
  await main.getByRole('button', { name: 'Play' }).click();

  await expect(main.getByRole('heading', { name: 'Predict the next step' })).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((violation) => violation.id)).toEqual([]);

  let answered = 0;
  for (let guard = 0; guard < 20; guard += 1) {
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
  await expect(main.getByText('Found 60.')).toBeVisible();
  await expect(main.getByText(/Score: \d of 3 correct/)).toBeVisible();
});
