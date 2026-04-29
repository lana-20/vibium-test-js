/**
 * Enhancement proposal: pierce selector support for shadow DOM
 *
 * CSS selectors passed to page.find() / page.findAll() do not cross shadow
 * boundaries. There is no pierce combinator (>> or >>>) to query into shadow
 * roots, forcing all shadow DOM access through page.evaluate() + shadowRoot.
 *
 * Proposed API:
 *   page.find('my-paragraph >> p')          // pierce one level
 *   page.find('my-paragraph >>> p')         // deep pierce (nested shadows)
 *   page.findAll('my-paragraph >> li')      // pierce + findAll
 *
 * Current workaround: page.evaluate() with manual shadowRoot traversal.
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

// PASS: confirms standard CSS selector cannot reach inside shadow roots
test('confirmed: standard CSS selector does not pierce shadow root', async ({ page }) => {
  await page.go(URL);
  const found = await page.evaluate<boolean>(
    `document.querySelector('my-paragraph p') === null`
  );
  // Regular querySelector returns null — shadow content is encapsulated
  expect(found).toBe(true);
});

// PASS: workaround — access shadow content via evaluate + shadowRoot
test('workaround: shadowRoot.querySelector reaches shadow-internal paragraph', async ({ page }) => {
  await page.go(URL);
  const text = await page.evaluate<string>(
    `document.querySelector('my-paragraph').shadowRoot.querySelector('p').textContent.trim()`
  );
  expect(text).toBe('My default text');
});

// SKIP (proposed): pierce combinator — uncomment when feature is implemented
// test('proposed: page.find with >> pierce combinator reaches shadow-internal p', async ({ page }) => {
//   await page.go(URL);
//   const p = await page.find('my-paragraph >> p');
//   await expect(p).toHaveText('My default text');
// });

// SKIP (proposed): pierce combinator with findAll
// test('proposed: page.findAll with >> returns shadow-internal elements', async ({ page }) => {
//   await page.go(URL);
//   const paragraphs = await page.findAll('my-paragraph >> p');
//   await expect(paragraphs).toHaveCount(2);
// });
