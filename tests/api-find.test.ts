import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';

test('find by CSS selector', async ({ page }) => {
  await page.go(URL);
  expect(await page.find('h1').text()).toBeTruthy();
});

test('find by text', async ({ page }) => {
  await page.go(URL);
  const el = await page.find({ text: 'Button Demo' });
  expect(await el.text()).toContain('Button Demo');
});

test('find by role', async ({ page }) => {
  await page.go(URL);
  const heading = await page.find({ role: 'heading' });
  expect(await heading.isVisible()).toBe(true);
});

test('find by label', async ({ page }) => {
  await page.setContent('<html><body><label for="e">Email</label><input id="e" /></body></html>');
  const input = await page.find({ label: 'Email' });
  expect(await input.isVisible()).toBe(true);
});

test('find by placeholder', async ({ page }) => {
  await page.setContent('<html><body><input placeholder="Search here" /></body></html>');
  const input = await page.find({ placeholder: 'Search here' });
  expect(await input.isVisible()).toBe(true);
});

test('find by alt', async ({ page }) => {
  await page.setContent('<html><body><img src="x.png" alt="test-img" /></body></html>');
  const img = await page.find({ alt: 'test-img' });
  expect(await img.attr('alt')).toBe('test-img');
});

test('find by title attribute', async ({ page }) => {
  await page.setContent('<html><body><span title="tooltip-val">Text</span></body></html>');
  const el = await page.find({ title: 'tooltip-val' });
  expect(await el.attr('title')).toBe('tooltip-val');
});

test('find by testid', async ({ page }) => {
  await page.setContent('<html><body><button data-testid="my-btn">Click</button></body></html>');
  const btn = await page.find({ testid: 'my-btn' });
  expect(await btn.text()).toBe('Click');
});

test('find by xpath', async ({ page }) => {
  await page.go(URL);
  const el = await page.find({ xpath: '//h1' });
  expect(await el.text()).toBeTruthy();
});

test('findAll returns all matching elements', async ({ page }) => {
  await page.go(URL);
  const links = await page.findAll('a');
  expect(links.length).toBeGreaterThan(1);
});

test('element.find performs scoped search', async ({ page }) => {
  await page.setContent('<html><body><ul id="list"><li id="a">A</li><li>B</li></ul></body></html>');
  const ul = await page.find('#list');
  const li = await ul.find('li');
  expect(await li.text()).toBeTruthy();
});

test('element.findAll performs scoped search', async ({ page }) => {
  await page.setContent('<html><body><ul id="list"><li>A</li><li>B</li><li>C</li></ul></body></html>');
  const ul = await page.find('#list');
  const items = await ul.findAll('li');
  expect(items.length).toBe(3);
});

test('fluent element chains method directly on find result', async ({ page }) => {
  await page.go(URL);
  const text = await page.find('h1').text();
  expect(text).toBeTruthy();
});
