import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const examples = [
  {
    structure: 'Linked List',
    operation: 'Traverse',
    first: 'current ← head; output ← []',
    last: 'return output',
  },
  {
    structure: 'Stack',
    operation: 'Inspect all',
    first: 'output ← []; current ← top',
    last: 'return output',
  },
  {
    structure: 'Queue',
    operation: 'Inspect all',
    first: 'output ← []; current ← front',
    last: 'return output',
  },
  {
    structure: 'Binary Search Tree',
    operation: 'Inorder',
    first: 'output ← []; visit(root): left → node → right',
    last: 'return output',
  },
  { structure: 'Priority Queue', operation: 'Extract min', first: 'minimum ← heap[0]', last: null },
  {
    structure: 'Graph',
    operation: 'BFS',
    first: 'discover start; queue ← [start]; output ← []',
    last: 'return output (reachable vertices only)',
  },
];

for (const example of examples) {
  test(`${example.structure} synchronizes pseudocode with playback in both themes`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: `Open ${example.structure} workspace` }).click();
    await page.getByRole('button', { name: 'Load sample' }).click();
    if (example.structure === 'Graph') await page.getByLabel('Vertex', { exact: true }).fill('1');
    await page.getByRole('button', { name: example.operation, exact: true }).click();
    const panel = page.getByRole('region', { name: 'Operation pseudocode', exact: true });
    const line = panel.locator('[aria-current="step"] code');
    await expect(line).toHaveText(example.first);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(line).not.toHaveText(example.first);
    const second = await line.textContent();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(line).toHaveText(example.first);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(line).toHaveText(second!);
    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(line).toHaveText(example.first);
    await expect(panel.locator('[data-state="executed"]')).toHaveCount(0);
    const speed = page.getByRole('combobox');
    await speed.selectOption('2');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await line.textContent();
    await speed.selectOption('0.5');
    await expect(line).toHaveText(paused!);
    const next = page.getByRole('button', { name: 'Next', exact: true });
    for (let guard = 0; guard < 100 && (await next.isEnabled()); guard++) await next.click();
    await expect(next).toBeDisabled();
    if (example.last) await expect(line).toHaveText(example.last);
    await expect(panel.getByRole('status')).toContainText((await line.textContent())!);
    await expect(panel.locator('[aria-current="step"]')).toHaveCount(1);

    for (const theme of ['dark', 'light']) {
      if (theme === 'light') await page.getByTestId('theme-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(panel.locator('.pseudocode-key')).toHaveCSS(
        'color',
        theme === 'light' ? 'rgb(80, 94, 73)' : 'rgb(174, 184, 170)',
      );
      const audit = await new AxeBuilder({ page })
        .include('.pseudocode-panel')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      await expect(line).toHaveText(
        (await panel.locator('[aria-current="step"] code').textContent())!,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      if (example.structure === 'Linked List') {
        await panel.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`pseudocode-${theme}.png`) });
      }
    }
    await panel.getByRole('region', { name: 'Scrollable pseudocode' }).focus();
    await expect(panel.getByRole('region', { name: 'Scrollable pseudocode' })).toBeFocused();
  });
}

test('graph keeps the visualization and pseudocode inside a bounded responsive stage', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Graph workspace' }).click();
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByLabel('Vertex', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'BFS', exact: true }).click();

  const workspace = page.locator('.graph-workspace');
  const stage = workspace.locator('.graph-visualizer-grid');
  const canvas = stage.locator('.canvas-panel');
  const pseudocode = stage.getByRole('region', { name: 'Operation pseudocode' });
  const codeViewport = pseudocode.getByRole('region', { name: 'Scrollable pseudocode' });
  const activeLine = pseudocode.locator('[aria-current="step"]');
  const viewport = page.viewportSize();

  await expect(stage).toBeVisible();
  await expect(pseudocode).toBeVisible();
  await expect(activeLine).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  const stageBox = await stage.boundingBox();
  const canvasBox = await canvas.boundingBox();
  const pseudocodeBox = await pseudocode.boundingBox();
  const codeViewportBox = await codeViewport.boundingBox();
  const activeLineBox = await activeLine.boundingBox();
  expect(stageBox && canvasBox && pseudocodeBox && codeViewportBox && activeLineBox).toBeTruthy();
  if (!stageBox || !canvasBox || !pseudocodeBox || !codeViewportBox || !activeLineBox) {
    throw new Error('Expected the graph learning stage to have measurable visible regions.');
  }

  if ((viewport?.width ?? 0) > 760) {
    expect(Math.abs(canvasBox.y - pseudocodeBox.y)).toBeLessThan(2);
    expect(stageBox.height).toBeLessThanOrEqual(600);
    expect(pseudocodeBox.x + pseudocodeBox.width).toBeLessThanOrEqual(viewport?.width ?? Infinity);
  } else {
    expect(pseudocodeBox.y).toBeGreaterThan(canvasBox.y + canvasBox.height);
    expect(pseudocodeBox.width).toBeLessThanOrEqual(stageBox.width);
  }

  expect(activeLineBox.y).toBeGreaterThanOrEqual(codeViewportBox.y);
  expect(activeLineBox.y + activeLineBox.height).toBeLessThanOrEqual(
    codeViewportBox.y + codeViewportBox.height,
  );
});
