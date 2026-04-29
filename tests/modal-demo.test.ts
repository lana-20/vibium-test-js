import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/modal-demo';

test('open mission briefing shows dialog', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.wait(800);
  const dialog = await page.find('[role=dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveText('Mission Briefing');
});

test('close button dismisses modal', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.wait(800);
  await page.find({ text: 'Close', role: 'button' }).click();
  await page.wait(800);
  expect(await page.evaluate<boolean>(`!!document.querySelector('[role=dialog][data-state="open"]')`)).toBe(false);
});

test('acknowledge and close button also closes modal', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.wait(800);
  await page.find('[role=dialog] .flex-col-reverse button').click();
  await page.wait(800);
  expect(await page.evaluate<boolean>(`!!document.querySelector('[role=dialog][data-state="open"]')`)).toBe(false);
});

test('interaction counter increments on modal open', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.wait(2000);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/Modal Interactions:\s*1/);
});

test('form modal opens with mission creation form', async ({ page }) => {
  await page.go(URL);
  await page.find('#form-modal-trigger').click();
  await page.wait(800);
  const dialog = await page.find('[role=dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveText('New Mission Creation');
});
