import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('inserts, peeks, extracts, switches, and resets a priority queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Priority Queue workspace' }).click();
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

test('practice mode asks three heap questions during insert', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Priority Queue workspace' }).click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('checkbox', { name: 'Practice mode' }).check();
  await main.getByRole('button', { name: 'Load sample' }).click();
  await main.getByLabel('Priority value').fill('-2');
  await main.getByRole('button', { name: 'Insert', exact: true }).click();
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
  await expect(
    main.getByText('-2 is at the root, so it is now the highest-priority item.'),
  ).toBeVisible();
  await expect(main.getByText(/Score: \d of 3 correct/)).toBeVisible();
});
