import { test, expect } from '@playwright/test';
import { SOLUTIONS } from './solutions.js';
import { seedProgress, clearProgress } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await clearProgress(page);
});

test('first exercise loads with editor, truth table, and diagram pane', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#exercise-not h2')).toHaveText(/1\. Not/);
  await expect(page.locator('#exercise-not .cm-content')).toBeVisible();
  await expect(page.locator('#exercise-not .exercise-spec-pane table')).toBeVisible();
  await expect(page.locator('#exercise-not .exercise-diagram-pane')).toBeVisible();
});

test('solving Not unlocks And', async ({ page }) => {
  await seedProgress(page, { not: { code: SOLUTIONS.not, solved: false } });
  await page.goto('/');
  await page.locator('#exercise-not .run-btn').click();
  await expect(page.locator('#exercise-not .success-indicator')).toBeVisible();
  await expect(page.locator('#exercise-not .success-indicator')).toContainText(/Next: And/);
  await expect(page.locator('#exercise-and')).toBeVisible();
});

test('reload restores progress', async ({ page }) => {
  await seedProgress(page, { not: { code: SOLUTIONS.not, solved: false } });
  await page.goto('/');
  await page.locator('#exercise-not .run-btn').click();
  await expect(page.locator('#exercise-and')).toBeVisible();

  await page.reload();
  await expect(page.locator('#exercise-not')).toBeVisible();
  await expect(page.locator('#exercise-and')).toBeVisible();
  // Saved code is restored into the editor (not the skeleton)
  await expect(page.locator('#exercise-not .cm-content')).toContainText('Nand(a=in, b=in, out=out)');
});

test('incorrect solution shows the failure banner', async ({ page }) => {
  const wrong = `CHIP Not {
    IN in;
    OUT out;
    PARTS:
    Nand(a=in, b=in, out=mid);
    Nand(a=mid, b=mid, out=out);
}`;
  await seedProgress(page, { not: { code: wrong, solved: false } });
  await page.goto('/');
  await page.locator('#exercise-not .run-btn').click();
  await expect(page.locator('#exercise-not .failure-banner')).toBeVisible();
  await expect(page.locator('#exercise-not .failure-banner')).toContainText(/test case.*don't match/);
});

test('format toggle switches dec/hex/bin on a multi-bit exercise', async ({ page }) => {
  // Seed all 6 prerequisites for Not16 as solved so it renders.
  const seed = {};
  for (const id of ['not', 'and', 'or', 'xor', 'mux', 'dmux']) {
    seed[id] = { code: SOLUTIONS[id], solved: true };
  }
  await seedProgress(page, seed);
  await page.goto('/');

  const not16 = page.locator('#exercise-not16');
  await expect(not16).toBeVisible();
  const cell = not16.locator('.exercise-spec-pane table tbody tr').first().locator('td').first();

  await not16.locator('.format-toggle-btn[data-format="bin"]').click();
  await expect(cell).toHaveText(/^[01_]+$/);

  await not16.locator('.format-toggle-btn[data-format="hex"]').click();
  await expect(cell).toHaveText(/^0x[0-9A-F]+$/);

  await not16.locator('.format-toggle-btn[data-format="dec"]').click();
  await expect(cell).toHaveText(/^\d+$/);
});
