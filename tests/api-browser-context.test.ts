import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';

test('context.cookies returns array of cookies', async ({ context, page }) => {
  await page.go(URL);
  const cookies = await context.cookies();
  expect(Array.isArray(cookies)).toBe(true);
});

test('context.setCookies sets a cookie readable by the page', async ({ context, page }) => {
  await page.go(URL);
  await context.setCookies([{
    name: 'vibium-test',
    value: 'coverage',
    domain: 'testtrack.org',
    path: '/',
  }]);
  const cookies = await context.cookies(['https://testtrack.org']);
  expect(cookies.some((c) => c.name === 'vibium-test' && c.value === 'coverage')).toBe(true);
});

test('context.clearCookies removes all cookies', async ({ context, page }) => {
  await page.go(URL);
  await context.setCookies([{ name: 'vibium-clear', value: '1', domain: 'testtrack.org', path: '/' }]);
  await context.clearCookies();
  const cookies = await context.cookies(['https://testtrack.org']);
  expect(cookies.length).toBe(0);
});

test('context.storage returns cookies and origin storage', async ({ context, page }) => {
  await page.go(URL);
  const state = await context.storage();
  expect(Array.isArray(state.cookies)).toBe(true);
  expect(Array.isArray(state.origins)).toBe(true);
});

test('context.setStorage injects localStorage value', async ({ context, page }) => {
  await page.go(URL);
  await context.setStorage({
    cookies: [],
    origins: [{
      origin: 'https://testtrack.org',
      localStorage: [{ name: 'vibium-injected', value: 'set' }],
      sessionStorage: [],
    }],
  });
  await page.reload();
  const val = await page.evaluate<string | null>('localStorage.getItem("vibium-injected")');
  expect(val).toBe('set');
});

test('context.clearStorage removes localStorage entries', async ({ context, page }) => {
  await page.go(URL);
  await page.evaluate<void>('localStorage.setItem("vibium-clear-test", "yes")');
  await context.clearStorage();
  await page.reload();
  const val = await page.evaluate<string | null>('localStorage.getItem("vibium-clear-test")');
  expect(val).toBeNull();
});

test('context.addInitScript runs before page scripts on next navigation', async ({ context, page }) => {
  await context.addInitScript('window.__initTest = "init-ran";');
  await page.go(URL);
  const val = await page.evaluate<string>('window.__initTest');
  expect(val).toBe('init-ran');
});

test('browser.newPage creates an additional page', async ({ browser }) => {
  const newPage = await browser.newPage();
  await newPage.go(URL);
  expect(await newPage.url()).toContain('testtrack.org');
  await newPage.close();
});

test('browser.newContext creates an isolated browsing context', async ({ browser }) => {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await pg.go(URL);
  expect(await pg.url()).toContain('testtrack.org');
  await ctx.close();
});

test('browser.pages returns at least one open page', async ({ browser }) => {
  const pages = await browser.pages();
  expect(pages.length).toBeGreaterThanOrEqual(1);
});
