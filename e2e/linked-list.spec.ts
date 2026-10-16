import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('builds, searches, traverses, deletes, and resets a linked list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Linked List workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Linked List' })).toBeVisible();

  const input = page.getByLabel('Node value', { exact: true });
  await input.fill('13');
  await page.getByRole('button', { name: 'Insert head' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('Current list contains 1 node')).toBeVisible();

  await input.fill('21');
  await page.getByRole('button', { name: 'Insert tail' }).click();
  while (await page.getByRole('button', { name: 'Next' }).isEnabled()) {
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByLabel('Current list contains 2 nodes')).toBeVisible();

  await page.getByRole('button', { name: 'Traverse' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  while (await page.getByRole('button', { name: 'Next' }).isEnabled()) {
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByLabel('Traversal output')).toContainText('13');
  await expect(page.getByLabel('Traversal output')).toContainText('21');

  await input.fill('13');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  while (await page.getByRole('button', { name: 'Next' }).isEnabled()) {
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByText('Found 13. The search stops at the first match.')).toBeVisible();

  await page.getByRole('button', { name: 'Delete first' }).click();
  while (await page.getByRole('button', { name: 'Next' }).isEnabled()) {
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByLabel('Current list contains 1 node')).toBeVisible();

  await page.getByRole('button', { name: 'Reset list' }).click();
  await expect(page.getByText('Your list is empty')).toBeVisible();
});

test('honors the reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Linked List workspace' }).click();

  const durationInMilliseconds = await page
    .getByRole('button', { name: 'Insert head' })
    .evaluate((button) => {
      const duration = getComputedStyle(button).transitionDuration;
      return duration.endsWith('ms')
        ? Number.parseFloat(duration)
        : Number.parseFloat(duration) * 1000;
    });

  expect(durationInMilliseconds).toBeLessThanOrEqual(0.01);
});

test('practice mode asks, grades, and reveals each checkpoint', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Linked List workspace' }).click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('checkbox', { name: 'Practice mode' }).check();
  await main.getByRole('button', { name: 'Load sample' }).click();
  await main.getByLabel('Node value', { exact: true }).fill('34');
  await main.getByRole('button', { name: 'Search', exact: true }).click();
  await main.getByRole('button', { name: 'Play' }).click();

  // Autoplay stops at the first checkpoint and waits for an answer.
  await expect(main.getByRole('heading', { name: 'Predict the next step' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Next' })).toBeDisabled();
  const violations = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(violations.violations.map((violation) => violation.id)).toEqual([]);

  let answered = 0;
  while (answered < 5) {
    const question = main.getByRole('heading', { name: 'Predict the next step' });
    if (await question.isVisible()) {
      await main.locator('.practice-option').first().click();
      await expect(main.getByRole('status').filter({ hasText: /Correct|Not quite/ })).toBeVisible();
      await main.getByRole('button', { name: 'Show the step' }).click();
      answered += 1;
    } else if (await main.getByRole('button', { name: 'Next' }).isEnabled()) {
      await main.getByRole('button', { name: 'Next' }).click();
    } else {
      break;
    }
  }

  expect(answered).toBe(3);
  await expect(main.getByText('Found 34. The search stops at the first match.')).toBeVisible();
  await expect(main.getByText(/Score: \d of 3 correct/)).toBeVisible();
});
