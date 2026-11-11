import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated WCAG 2.1 A/AA audit (axe-core) of every workspace, both with sample data loaded
 * and part-way through a trace, so highlighted states and the inspector are also checked.
 * Automated checks cover only part of WCAG; the report lists the manual checks still needed.
 */
const WORKSPACES = [
  { button: 'Linked List', operation: 'Traverse' },
  { button: 'Stack', operation: 'Inspect all' },
  { button: 'Queue', operation: 'Inspect all' },
  { button: 'Binary Search Tree', operation: 'Inorder' },
  { button: 'Priority Queue', operation: 'Extract min' },
  { button: 'Graph', operation: 'BFS', vertex: '1' },
] as const;

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

for (const workspace of WORKSPACES) {
  test(`${workspace.button} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: `Open ${workspace.button} workspace`, exact: true })
      .click();
    const main = page.locator('main:not([hidden])');

    expect(await audit(page)).toEqual([]);

    await main.getByRole('button', { name: 'Load sample' }).click();
    if ('vertex' in workspace)
      await main.getByLabel('Vertex', { exact: true }).fill(workspace.vertex);
    await main.getByRole('button', { name: workspace.operation, exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    expect(await audit(page)).toEqual([]);
  });
}

test('the complexity table has no detectable WCAG A/AA violations in either theme', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the complexity table' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Complexities' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(6);

  expect(await audit(page)).toEqual([]);

  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  expect(await audit(page)).toEqual([]);

  // The page never scrolls sideways; wide tables scroll inside their own region.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
