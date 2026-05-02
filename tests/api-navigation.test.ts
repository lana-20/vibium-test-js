import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';
const URL2 = 'https://testtrack.org/button-demo';

test('go navigates to URL', async ({ page }) => {
  await page.go(URL);
  expect(await page.url()).toContain('testtrack.org');
});

test('url returns current page URL', async ({ page }) => {
  await page.go(URL);
  expect(await page.url()).toContain('testtrack.org');
});

test('title returns page title string', async ({ page }) => {
  await page.go(URL);
  expect((await page.title()).length).toBeGreaterThan(0);
});

test('content returns full page HTML', async ({ page }) => {
  await page.go(URL);
  const html = await page.content();
  expect(html).toContain('<html');
  expect(html).toContain('</html>');
});

test('back navigates to previous page', async ({ page }) => {
  await page.go(URL);
  await page.go(URL2);
  await page.back();
  expect(await page.url()).not.toContain('button-demo');
});

test('forward navigates after back', async ({ page }) => {
  await page.go(URL);
  await page.go(URL2);
  await page.back();
  await page.forward();
  expect(await page.url()).toContain('button-demo');
});

test('reload reloads current page', async ({ page }) => {
  await page.go(URL);
  const titleBefore = await page.title();
  await page.reload();
  expect(await page.title()).toBe(titleBefore);
});
