import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function finishOperation(page: import('@playwright/test').Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  while (await next.isEnabled()) await next.click();
}

test('large integers fit inside heap nodes and array cells at the zoom limits', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Priority Queue workspace' }).click();
  const main = page.locator('main:not([hidden])');
  await main.getByRole('button', { name: 'Load sample' }).click();
  for (const value of ['1000000000000', '9007199254740991', '-9007199254740991']) {
    await main.getByLabel('Priority value').fill(value);
    await main.getByRole('button', { name: 'Insert', exact: true }).click();
    await finishOperation(page);
  }

  async function assertGeometry() {
    const geometry = await main.locator('.heap-svg').evaluate((svg) => {
      const nodes = Array.from(svg.querySelectorAll('.heap-node')).map((node) => {
        const text = node.querySelector<SVGTextElement>('.heap-value')!;
        const box = text.getBBox();
        const circle = node.querySelector('circle')!;
        const x = Number(circle.getAttribute('cx'));
        const y = Number(circle.getAttribute('cy'));
        const radius = Number(circle.getAttribute('r'));
        return {
          value: text.textContent,
          x,
          y,
          radius,
          fits: [box.x, box.x + box.width].every((cornerX) =>
            [box.y, box.y + box.height].every(
              (cornerY) => Math.hypot(cornerX - x, cornerY - y) < radius - 2,
            ),
          ),
        };
      });
      const cells = Array.from(svg.querySelectorAll('.heap-cell')).map((cell) => {
        const text = cell.querySelector<SVGTextElement>('.heap-value')!;
        const box = text.getBBox();
        const rect = cell.querySelector<SVGRectElement>('rect')!.getBBox();
        return {
          value: text.textContent,
          fits:
            box.x > rect.x + 4 &&
            box.x + box.width < rect.x + rect.width - 4 &&
            box.y > rect.y &&
            box.y + box.height < rect.y + rect.height,
        };
      });
      return { nodes, cells };
    });
    expect(geometry.nodes).toHaveLength(9);
    expect(geometry.nodes.every((node) => node.fits)).toBe(true);
    expect(geometry.cells.every((cell) => cell.fits)).toBe(true);
    expect(geometry.nodes.map((node) => node.value)).toEqual(
      geometry.cells.map((cell) => cell.value),
    );
    expect(geometry.nodes.map((node) => node.value)).toEqual(
      expect.arrayContaining(['1000000000000', '9007199254740991', '-9007199254740991']),
    );
    geometry.nodes.forEach((node, index) => {
      for (const other of geometry.nodes.slice(index + 1)) {
        expect(Math.hypot(node.x - other.x, node.y - other.y)).toBeGreaterThan(
          node.radius + other.radius,
        );
      }
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }

  await assertGeometry();
  await main.getByRole('button', { name: 'Zoom out visualization' }).click();
  await assertGeometry();
  const zoomIn = main.getByRole('button', { name: 'Zoom in visualization' });
  while (await zoomIn.isEnabled()) await zoomIn.click();
  await assertGeometry();
  await page.getByTestId('theme-toggle').click();
  await assertGeometry();
  await main.getByRole('button', { name: 'Reset visualization zoom to 100 percent' }).click();
  await page.screenshot({ path: testInfo.outputPath('heap-large-integers.png') });
});

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
