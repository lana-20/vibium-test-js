/**
 * Repro: page.evaluate() wraps nested array strings as BiDi typed objects
 *
 * When an eval expression returns a string[][] (array of string arrays),
 * the inner arrays' items come back as { type: "string", value: "..." }
 * objects instead of plain strings.
 *
 * Flat string[] deserializes correctly. Only nested arrays are affected.
 *
 * Workaround: JSON.stringify inside the eval, JSON.parse outside.
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

// PASS baseline: flat string[] deserializes correctly
test('baseline: flat string[] from evaluate deserializes as plain strings', async ({ page }) => {
  await page.go(URL);
  const modes = await page.evaluate<string[]>(
    `[...document.querySelectorAll('my-paragraph')].map(h => h.shadowRoot.mode)`
  );
  // Both values should be the plain string "open"
  expect(modes[0]).toBe('open');
  expect(modes[1]).toBe('open');
});

// FAIL: nested string[][] wraps inner strings as { type, value } objects
test('bug: nested string[][] from evaluate wraps inner strings as BiDi typed objects', async ({ page }) => {
  await page.go(URL);
  const structures = await page.evaluate<string[][]>(
    `[...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName))`
  );
  // Expected: [['STYLE', 'P'], ['STYLE', 'P']]
  // Actual:   [[{type:'string',value:'STYLE'}, {type:'string',value:'P'}], ...]
  expect(structures[0][0]).toBe('STYLE');
  expect(structures[0][1]).toBe('P');
});

// PASS: JSON.stringify workaround restores correct types
test('workaround: JSON.stringify/parse round-trip fixes nested array deserialization', async ({ page }) => {
  await page.go(URL);
  const json = await page.evaluate<string>(
    `JSON.stringify([...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName)))`
  );
  const structures = JSON.parse(json) as string[][];
  expect(structures[0]).toEqual(['STYLE', 'P']);
  expect(structures[1]).toEqual(['STYLE', 'P']);
});
