import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';
const MOCK_URL = 'https://example-vibium-mock.local/';

test('capture.response captures HTTP response for URL pattern', async ({ page }) => {
  // pattern without * does exact match; use glob to match any testtrack.org URL
  const response = await page.capture.response('**testtrack.org**', async () => {
    await page.go(URL);
  });
  expect(response.status()).toBe(200);
  expect(response.url()).toContain('testtrack.org');
});

test('capture.request captures outgoing request for URL pattern', async ({ page }) => {
  const request = await page.capture.request('**testtrack.org**', async () => {
    await page.go(URL);
  });
  expect(request.url()).toContain('testtrack.org');
  expect(request.method()).toBe('GET');
});

test('onRequest receives all outgoing requests', async ({ page }) => {
  const urls: string[] = [];
  page.onRequest((req) => urls.push(req.url()));
  await page.go(URL);
  expect(urls.some((u) => u.includes('testtrack.org'))).toBe(true);
});

test('onResponse receives all completed responses', async ({ page }) => {
  const statuses: number[] = [];
  page.onResponse((res) => statuses.push(res.status()));
  await page.go(URL);
  expect(statuses.some((s) => s === 200)).toBe(true);
});

test('route.fulfill returns mocked response', async ({ page }) => {
  await page.route(MOCK_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body><h1 id="mock">Mocked</h1></body></html>',
    });
  });
  await page.go(MOCK_URL);
  const h1 = await page.evaluate<string>('document.querySelector("#mock").textContent');
  expect(h1).toBe('Mocked');
});

test('route.continue passes request through', async ({ page }) => {
  let intercepted = false;
  await page.route(`${URL}/**`, async (route) => {
    intercepted = true;
    await route.continue();
  });
  await page.go(URL);
  expect(intercepted).toBe(true);
  await page.unroute(`${URL}/**`);
});

test('unroute removes handler so it no longer intercepts', async ({ page }) => {
  let called = false;
  await page.route(`${URL}/**`, async (route) => {
    called = true;
    await route.continue();
  });
  await page.unroute(`${URL}/**`);
  await page.go(URL);
  expect(called).toBe(false);
});

test('setHeaders adds custom headers without breaking navigation', async ({ page }) => {
  await page.setHeaders({ 'X-Vibium-Coverage': 'true' });
  await page.go(URL);
  expect(await page.url()).toContain('testtrack.org');
});
