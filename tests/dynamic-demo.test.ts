import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/dynamic-demo';

test('content area shows waiting message initially', async ({ page }) => {
  await page.go(URL);
  const area = await page.find('#dynamic-content-area');
  await expect(area).toHaveText('Awaiting dynamic content loading');
});

test('load classified archives replaces placeholder with data', async ({ page }) => {
  await page.go(URL);
  await page.find('#load-async-data-btn').click();
  await page.waitUntil(
    `!document.querySelector('#dynamic-content-area')?.textContent.includes('Awaiting')`,
    { timeout: 10000 },
  );
  const area = await page.find('#dynamic-content-area');
  expect(await area.isVisible()).toBe(true);
  const text = await area.text();
  expect(text).not.toContain('Awaiting dynamic content loading');
  expect(text.length).toBeGreaterThan(10);
});

test('start monitoring shows active status in live feed', async ({ page }) => {
  await page.go(URL);
  await page.find('#start-monitoring-btn').click();
  await page.waitUntil(
    `document.querySelector('#live-status-feed')?.textContent.includes('MONITORING ACTIVE')`,
    { timeout: 5000 },
  );
  const feed = await page.find('#live-status-feed');
  await expect(feed).toHaveText('MONITORING ACTIVE');
});

test('stop monitoring button halts signal updates', async ({ page }) => {
  await page.go(URL);
  await page.find('#start-monitoring-btn').click();
  await page.waitUntil(
    `document.querySelector('#live-status-feed')?.textContent.includes('MONITORING ACTIVE')`,
    { timeout: 5000 },
  );
  await page.find('#stop-monitoring-btn').click();
  await page.waitUntil(
    `!document.querySelector('#live-status-feed')?.textContent.includes('MONITORING ACTIVE')`,
    { timeout: 5000 },
  );
  const feed = await page.find('#live-status-feed');
  expect(await feed.text()).not.toContain('MONITORING ACTIVE');
});

test('threat analysis produces a result', async ({ page }) => {
  await page.go(URL);
  await page.find('#threat-analysis-btn').click();
  await page.waitUntil(
    `document.body.textContent.includes('LEVEL')`,
    { timeout: 8000 },
  );
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/LEVEL\s*\d/);
});
