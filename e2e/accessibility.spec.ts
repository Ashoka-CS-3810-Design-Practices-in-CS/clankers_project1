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
    const nav = page.getByRole('navigation', { name: 'Data structures' });
    await nav.getByRole('button', { name: new RegExp(`^${workspace.button},`) }).click();
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
