import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/modal-demo';

test('open mission briefing shows dialog', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  const dialog = await page.find('[role=dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveText('Mission Briefing');
});

test('close button dismisses modal', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.find({ text: 'Close', role: 'button' }).click();
  await page.waitUntil(`document.querySelector('[role=dialog]') === null`, { timeout: 3000 });
  expect(await page.evaluate(`document.querySelector('[role=dialog]') === null`)).toBe(true);
});

test('acknowledge and close button also closes modal', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.find({ text: 'ACKNOWLEDGE & CLOSE' }).click();
  await page.waitUntil(`document.querySelector('[role=dialog]') === null`, { timeout: 3000 });
  expect(await page.evaluate(`document.querySelector('[role=dialog]') === null`)).toBe(true);
});

test('interaction counter increments on modal open', async ({ page }) => {
  await page.go(URL);
  await page.find('#simple-modal-trigger').click();
  await page.waitUntil(`document.body.textContent.includes('Modal Interactions: 1')`, { timeout: 3000 });
  const count = await page.evaluate<string>(`
    [...document.querySelectorAll('p')].find(p => p.textContent.includes('Modal Interactions'))?.textContent.trim()
  `);
  expect(count).toBe('Modal Interactions: 1');
});

test('form modal opens with mission creation form', async ({ page }) => {
  await page.go(URL);
  await page.find('#form-modal-trigger').click();
  const dialog = await page.find('[role=dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveText('NEW MISSION');
});
