import { expect, test, type Locator, type Page } from '@playwright/test';

/** True when the element's centre lies inside the visible part of the scroll container. */
async function centreIsVisible(element: Locator, container: Locator) {
  const [box, frame] = await Promise.all([element.boundingBox(), container.boundingBox()]);
  if (!box || !frame) return false;
  const centre = box.x + box.width / 2;
  return centre >= frame.x && centre <= frame.x + frame.width;
}

async function open(page: Page, name: string) {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Data structures' })
    .getByRole('button', { name: new RegExp(`^${name},`) })
    .click();
  return page.locator('main:not([hidden])');
}

test('tree canvas keeps the root and the current node in view', async ({ page }) => {
  const main = await open(page, 'Binary Search Tree');
  await main.getByRole('button', { name: 'Load sample' }).click();
  const scroll = main.locator('.tree-scroll');
  await expect
    .poll(() => centreIsVisible(main.locator('.tree-node').filter({ hasText: /^root/ }), scroll))
    .toBe(true);

  await main.getByLabel('Tree node value').fill('80');
  await main.getByRole('button', { name: 'Search', exact: true }).click();
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) {
    await next.click();
    const current = main.locator('.tree-node.state-active, .tree-node.state-matched').first();
    if (await current.count()) await expect.poll(() => centreIsVisible(current, scroll)).toBe(true);
  }
});

test('heap canvas keeps the moving item in view', async ({ page }) => {
  const main = await open(page, 'Priority Queue');
  const input = main.getByLabel('Priority value');
  for (let value = 40; value > 10; value -= 1) {
    await input.fill(String(value));
    await main.getByRole('button', { name: 'Insert', exact: true }).click();
    const next = page.getByRole('button', { name: 'Next', exact: true });
    while (await next.isEnabled()) await next.click();
  }
  const scroll = main.locator('.heap-scroll');
  await expect.poll(() => centreIsVisible(main.locator('.heap-node').first(), scroll)).toBe(true);
});
