/**
 * Coverage: waitUntil.url, waitUntil.loaded, waitUntil(expression), wait
 * Bug 1 (VibiumDev/vibium#123): FIXED in v26.5.31 (#163) — bare expressions now accepted
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

test('waitUntil.url resolves when URL matches pattern', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil.url('shadowdom');
});

test('waitUntil.loaded resolves when page reaches load state', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil.loaded();
});

test('wait pauses for the given milliseconds', async ({ page }) => {
  await page.go(URL);
  const start = Date.now();
  await page.wait(500);
  expect(Date.now() - start).toBeGreaterThanOrEqual(450);
});

// BUG 1 — waitUntil(expression) times out even when expression is immediately true
// (https://github.com/VibiumDev/vibium/issues/118)
test('bug1 FIXED (#123/#163): waitUntil(expression) with immediately-true readyState — times out', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil.url('shadowdom');
  await page.waitUntil(`document.readyState === "complete"`, { timeout: 5000 });
  expect(true).toBe(true);
});

// BUG 1 — second repro: element already present on page
test('bug1 FIXED (#123/#163): waitUntil(expression) with present element — times out', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil(`!!document.querySelector('my-paragraph')`, { timeout: 5000 });
  expect(true).toBe(true);
});
