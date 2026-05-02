/**
 * Repro: clock.setFixedTime() silently does nothing without clock.install()
 *
 * Calling page.clock.setFixedTime(time) without a prior clock.install() has
 * no observable effect — Date.now() continues returning live system time and
 * no error is thrown, so the caller has no indication the call failed.
 *
 * Root cause: the Go handler evaluates window.__vibiumClock.setFixedTime(time)
 * in the page. window.__vibiumClock is only injected by clock.install().
 * Without it the expression throws a ReferenceError that is caught internally;
 * the handler returns success anyway, masking the failure.
 *
 * Playwright's page.clock.setFixedTime() works standalone — install() is not
 * required. Vibium should match this behaviour or at minimum throw an error.
 *
 * Workaround used in production tests: always call clock.install() first.
 */
import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';
const FIXED_MS = new Date('2020-01-01T00:00:00.000Z').getTime(); // 1577836800000

// FAIL: setFixedTime without install — Date.now() returns live system time
test('bug: setFixedTime without install silently does nothing', async ({ page }) => {
  await page.go(URL);
  await page.clock.setFixedTime('2020-01-01T00:00:00.000Z');
  const ts = await page.evaluate<number>('Date.now()');
  // If bug is present: ts is ~1777686xxxxx (live system time, ~6 billion ms off)
  // If bug is fixed:   ts === 1577836800000
  expect(ts).toBe(FIXED_MS);
});

// PASS workaround: install() first, then setFixedTime works correctly
test('workaround: setFixedTime works when preceded by clock.install()', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.clock.setFixedTime('2020-01-01T00:00:00.000Z');
  const t1 = await page.evaluate<number>('Date.now()');
  await page.wait(150);
  const t2 = await page.evaluate<number>('Date.now()');
  expect(t1).toBe(FIXED_MS);
  expect(t1).toBe(t2); // time is frozen
});
