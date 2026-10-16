import AxeBuilder from '@axe-core/playwright';
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

test('practice mode holds stack inspection at three checkpoints', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Stack workspace' }).click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('checkbox', { name: 'Practice mode' }).check();
  await main.getByRole('button', { name: 'Load sample' }).click();
  await main.getByRole('button', { name: 'Inspect all' }).click();
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
  await expect(main.getByText(/Score: \d of 3 correct/)).toBeVisible();
});
