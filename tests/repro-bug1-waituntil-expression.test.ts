/**
 * Repro: page.waitUntil(expression) always times out
 *
 * page.waitUntil(expr, opts) should resolve once the JS expression returns
 * truthy. Instead it always throws a timeout error, even for expressions that
 * are immediately true (e.g. `document.readyState === "complete"` on a fully
 * loaded page).
 *
 * page.waitUntil.url() is unaffected — only expression-based waitUntil fails.
 *
 * Workaround used in production tests: replace with page.wait(ms) fixed delays.
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

// PASS baseline: page.waitUntil.url() works — confirms the page and session
// are healthy and the issue is specific to the expression overload.
test('baseline: waitUntil.url resolves correctly', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil.url('shadowdom');
  const count = await page.evaluate<number>(`document.querySelectorAll('my-paragraph').length`);
  expect(count).toBe(2);
});

// FAIL: expression that is immediately true on a loaded page still times out
test('bug: waitUntil(expression) times out even when expression is immediately true', async ({ page }) => {
  await page.go(URL);
  await page.waitUntil.url('shadowdom');
  // document.readyState is already "complete" at this point — should resolve instantly
  await page.waitUntil(`document.readyState === "complete"`, { timeout: 5000 });
  // If we reach here the bug is fixed. If not, the test times out with:
  // "Waiting for expression timed out after 5000ms"
  expect(true).toBe(true);
});

// FAIL: expression that becomes true after a DOM mutation also times out
test('bug: waitUntil(expression) times out waiting for element to appear', async ({ page }) => {
  await page.go(URL);
  // my-paragraph is present on this page — shadowRoot should not be null
  await page.waitUntil(`!!document.querySelector('my-paragraph')`, { timeout: 5000 });
  expect(true).toBe(true);
});
