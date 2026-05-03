/**
 * Coverage: evaluate — string, number, boolean, object, flat array, nested array
 * Bug 2 (VibiumDev/vibium#124): nested string[][] inner strings deserialize as {type,value} — test marked test.skip
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

test('evaluate returns string', async ({ page }) => {
  await page.go(URL);
  const title = await page.evaluate<string>('document.title');
  expect(typeof title).toBe('string');
  expect(title.length).toBeGreaterThan(0);
});

test('evaluate returns number', async ({ page }) => {
  await page.go(URL);
  const count = await page.evaluate<number>(`document.querySelectorAll('my-paragraph').length`);
  expect(count).toBe(2);
});

test('evaluate returns boolean', async ({ page }) => {
  await page.go(URL);
  const hasBody = await page.evaluate<boolean>('document.body !== null');
  expect(hasBody).toBe(true);
});

test('evaluate returns object', async ({ page }) => {
  await page.go(URL);
  const dims = await page.evaluate<{ width: number; height: number }>(
    '({width: window.innerWidth, height: window.innerHeight})'
  );
  expect(dims.width).toBeGreaterThan(0);
  expect(dims.height).toBeGreaterThan(0);
});

test('evaluate returns flat string[]', async ({ page }) => {
  await page.go(URL);
  const modes = await page.evaluate<string[]>(
    `[...document.querySelectorAll('my-paragraph')].map(h => h.shadowRoot.mode)`
  );
  expect(modes[0]).toBe('open');
  expect(modes[1]).toBe('open');
});

// BUG 2 — nested string[][] inner items are {type,value} objects, not strings
// (https://github.com/VibiumDev/vibium/issues/118)
test.skip('bug2: evaluate nested string[][] wraps inner strings as BiDi typed objects', async ({ page }) => {
  await page.go(URL);
  const structures = await page.evaluate<string[][]>(
    `[...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName))`
  );
  expect(structures[0][0]).toBe('STYLE');
  expect(structures[0][1]).toBe('P');
});

test('evaluate nested string[][] with JSON.stringify workaround', async ({ page }) => {
  await page.go(URL);
  const json = await page.evaluate<string>(
    `JSON.stringify([...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName)))`
  );
  const structures = JSON.parse(json) as string[][];
  expect(structures[0]).toEqual(['STYLE', 'P']);
  expect(structures[1]).toEqual(['STYLE', 'P']);
});
