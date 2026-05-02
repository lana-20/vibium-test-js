import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';
const LOGIN = 'https://testtrack.org/login-demo';

test('text returns trimmed textContent', async ({ page }) => {
  await page.go(URL);
  expect((await page.find('h1').text()).length).toBeGreaterThan(0);
});

test('innerText excludes hidden content', async ({ page }) => {
  await page.setContent('<html><body><p id="p">Hello <span style="display:none">hidden</span> world</p></body></html>');
  const inner = await page.find('#p').innerText();
  expect(inner).toContain('Hello');
  expect(inner).not.toContain('hidden');
});

test('html returns innerHTML', async ({ page }) => {
  await page.setContent('<html><body><div id="d"><span>inner</span></div></body></html>');
  expect(await page.find('#d').html()).toContain('<span>');
});

test('value returns input value', async ({ page }) => {
  await page.go(LOGIN);
  const input = await page.find('#username');
  await input.fill('val@test.com');
  expect(await input.value()).toBe('val@test.com');
});

test('attr returns attribute value', async ({ page }) => {
  await page.setContent('<html><body><a id="a" href="/about">Link</a></body></html>');
  expect(await page.find('#a').attr('href')).toBe('/about');
});

test('getAttribute is alias of attr', async ({ page }) => {
  await page.setContent('<html><body><a id="a" href="/about">Link</a></body></html>');
  expect(await page.find('#a').getAttribute('href')).toBe('/about');
});

test('attr returns null for missing attribute', async ({ page }) => {
  await page.setContent('<html><body><span id="s">text</span></body></html>');
  expect(await page.find('#s').attr('href')).toBeNull();
});

test('bounds returns positive bounding box', async ({ page }) => {
  await page.go(URL);
  const box = await page.find('h1').bounds();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
});

test('boundingBox is alias of bounds', async ({ page }) => {
  await page.go(URL);
  expect((await page.find('h1').boundingBox()).width).toBeGreaterThan(0);
});

test('isVisible returns true for visible element', async ({ page }) => {
  await page.go(URL);
  expect(await page.find('h1').isVisible()).toBe(true);
});

test('isHidden returns true for hidden element', async ({ page }) => {
  await page.setContent('<html><body><div id="h" style="display:none">hidden</div></body></html>');
  expect(await page.find('#h').isHidden()).toBe(true);
});

test('isEnabled returns true for enabled input', async ({ page }) => {
  await page.go(LOGIN);
  expect(await page.find('#username').isEnabled()).toBe(true);
});

test('isEnabled returns false for disabled input', async ({ page }) => {
  await page.setContent('<html><body><input id="dis" disabled /></body></html>');
  expect(await page.find('#dis').isEnabled()).toBe(false);
});

test('isChecked returns true after checking native checkbox', async ({ page }) => {
  await page.setContent('<html><body><input type="checkbox" id="cb" /></body></html>');
  const cb = await page.find('#cb');
  await cb.check();
  expect(await cb.isChecked()).toBe(true);
});

test('isEditable returns true for enabled input', async ({ page }) => {
  await page.go(LOGIN);
  expect(await page.find('#username').isEditable()).toBe(true);
});

test('isEditable returns false for readonly input', async ({ page }) => {
  await page.setContent('<html><body><input id="ro" readonly /></body></html>');
  expect(await page.find('#ro').isEditable()).toBe(false);
});

test('role returns computed ARIA role', async ({ page }) => {
  await page.go(URL);
  const link = await page.find({ role: 'link' });
  expect(await link.role()).toBe('link');
});

test('label returns accessible name', async ({ page }) => {
  await page.setContent('<html><body><label for="e">Email Input</label><input id="e" /></body></html>');
  const input = await page.find('#e');
  expect((await input.label()).toLowerCase()).toContain('email');
});

test('element screenshot returns PNG buffer', async ({ page }) => {
  await page.go(URL);
  const buf = await page.find('h1').screenshot();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
  expect(buf.slice(0, 4).toString('hex')).toBe('89504e47');
});
