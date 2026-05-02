/**
 * Repro: capture.navigation() and page.url() miss history.pushState() navigation
 *
 * page.capture.navigation() always times out when navigation happens via
 * history.pushState() (client-side SPA routing). The URL changes in the
 * browser but the promise never resolves.
 *
 * page.url() has the same blind spot: it returns the pre-navigation URL after
 * a pushState change.
 *
 * Root cause: the Go binary subscribes to browsingContext.load (full page
 * loads) and browsingContext.fragmentNavigated (hash # changes). pushState
 * triggers neither. Chrome 123+ added browsingContext.historyUpdated for
 * pushState/replaceState — adding that subscription would fix both issues.
 *
 * Workaround used in production tests: replace capture.navigation() with
 * page.wait(ms) + page.evaluate('window.location.href').
 */
import { expect } from 'vitest';
import { test } from '../src';

const BASE = 'https://the-internet.herokuapp.com';

// PASS baseline: capture.navigation works for a real server-side navigation
test('baseline: capture.navigation resolves for a full-page navigation', async ({ page }) => {
  await page.go(BASE);
  const newUrl = await page.capture.navigation(async () => {
    await page.find({ role: 'link', text: 'JavaScript Alerts' }).click();
  }, { timeout: 5000 });
  expect(newUrl).toContain('javascript_alerts');
});

// FAIL: capture.navigation times out on history.pushState()
test('bug: capture.navigation times out when navigation uses history.pushState()', async ({ page }) => {
  await page.go(BASE);
  const newUrl = await page.capture.navigation(async () => {
    await page.evaluate<void>('history.pushState({}, "", "/simulated-spa-route")');
  }, { timeout: 2000 });
  // If bug is present: throws "Timeout waiting for navigation"
  // If bug is fixed:   newUrl contains "/simulated-spa-route"
  expect(newUrl).toContain('simulated-spa-route');
});

// FAIL: page.url() returns stale URL after history.pushState()
test('bug: page.url() returns stale value after history.pushState()', async ({ page }) => {
  await page.go(BASE);
  await page.evaluate<void>('history.pushState({}, "", "/new-route")');
  const reported = await page.url();
  const actual = await page.evaluate<string>('window.location.href');
  // actual is correct; reported is stale (still BASE)
  expect(reported).toBe(actual);
});
