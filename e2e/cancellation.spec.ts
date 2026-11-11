import { expect, test } from '@playwright/test';

const structures = [
  { name: 'Linked List', input: 'Node value', operation: 'Insert head', reset: 'Reset list' },
  { name: 'Stack', input: 'Item value', operation: 'Push', reset: 'Reset stack' },
  { name: 'Queue', input: 'Queue value', operation: 'Enqueue', reset: 'Reset queue' },
  {
    name: 'Binary Search Tree',
    input: 'Tree node value',
    operation: 'Insert',
    reset: 'Reset tree',
  },
  {
    name: 'Priority Queue',
    input: 'Priority value',
    operation: 'Insert',
    reset: 'Reset priority queue',
  },
  { name: 'Graph', input: 'Vertex', operation: 'Add vertex', reset: 'Reset graph' },
];

for (const structure of structures) {
  test(`${structure.name} can cancel or reset an unfinished operation`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: `Open ${structure.name} workspace` }).click();
    const main = page.locator('main:not([hidden])');
    await main.getByRole('button', { name: 'Load sample' }).click();
    const canvas = main.locator('.canvas-panel');
    const originalDrawing = await canvas.locator('svg[role="img"]').innerHTML();
    const input = main.getByLabel(structure.input, { exact: true });
    await input.fill('99');
    await main.getByRole('button', { name: structure.operation, exact: true }).click();
    await expect(input).toBeDisabled();
    const cancel = main.getByRole('button', { name: 'Cancel operation' });
    await expect(cancel).toBeEnabled();
    await expect(main.getByRole('button', { name: structure.reset, exact: true })).toBeEnabled();
    await cancel.focus();
    await cancel.press('Enter');
    await expect(input).toBeEnabled();
    await expect(main.getByText('No operation loaded')).toBeVisible();
    expect(await canvas.locator('svg[role="img"]').innerHTML()).toBe(originalDrawing);

    await main.getByRole('button', { name: structure.operation, exact: true }).click();
    await main.getByRole('button', { name: 'Play', exact: true }).click();
    await main.getByRole('button', { name: structure.reset, exact: true }).click();
    await expect(main.getByText('No operation loaded')).toBeVisible();
    await expect(canvas.locator('svg[role="img"]')).toHaveCount(0);
    await expect(input).toBeEnabled();
    await expect(cancel).toBeDisabled();
  });
}
