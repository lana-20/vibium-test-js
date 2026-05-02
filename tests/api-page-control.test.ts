import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';
const FRAMES_URL = 'https://the-internet.herokuapp.com/nested_frames';

test('screenshot returns PNG buffer', async ({ page }) => {
  await page.go(URL);
  const buf = await page.screenshot();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
  expect(buf.slice(0, 4).toString('hex')).toBe('89504e47');
});

test('screenshot fullPage returns buffer', async ({ page }) => {
  await page.go(URL);
  const buf = await page.screenshot({ fullPage: true });
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
});

test('pdf returns PDF buffer (headless only)', async ({ page }) => {
  await page.go(URL);
  const buf = await page.pdf();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.slice(0, 4).toString()).toBe('%PDF');
});

test('scroll scrolls page in given direction', async ({ page }) => {
  await page.go(URL);
  await page.scroll('down', 300);
  const scrollY = await page.evaluate<number>('window.scrollY');
  expect(scrollY).toBeGreaterThan(0);
});

test('setContent replaces page HTML', async ({ page }) => {
  await page.setContent('<html><body><h1 id="injected">Vibium</h1></body></html>');
  expect(await page.evaluate<string>('document.querySelector("#injected").textContent')).toBe('Vibium');
});

test('addScript injects and executes inline script', async ({ page }) => {
  await page.go(URL);
  await page.addScript('window.__vibiumAddScript = 99;');
  expect(await page.evaluate<number>('window.__vibiumAddScript')).toBe(99);
});

test('addStyle injects CSS that applies to the page', async ({ page }) => {
  await page.setContent('<html><body><p id="p">text</p></body></html>');
  await page.addStyle('#p { color: rgb(255, 0, 0); }');
  const color = await page.evaluate<string>('getComputedStyle(document.querySelector("#p")).color');
  expect(color).toBe('rgb(255, 0, 0)');
});

test('expose adds callable function to window', async ({ page }) => {
  await page.go(URL);
  await page.expose('vibiumAdd', 'function(a, b) { return a + b; }');
  const result = await page.evaluate<number>('vibiumAdd(10, 32)');
  expect(result).toBe(42);
});

test('setViewport and viewport round-trip', async ({ page }) => {
  await page.go(URL);
  await page.setViewport({ width: 1280, height: 720 });
  const vp = await page.viewport();
  expect(vp.width).toBe(1280);
  expect(vp.height).toBe(720);
});

test('window returns current window state and dimensions', async ({ page }) => {
  await page.go(URL);
  const win = await page.window();
  expect(win.state).toBeTruthy();
  expect(win.width).toBeGreaterThan(0);
  expect(win.height).toBeGreaterThan(0);
});

test('emulateMedia dark colorScheme matches media query', async ({ page }) => {
  await page.go(URL);
  await page.emulateMedia({ colorScheme: 'dark' });
  const isDark = await page.evaluate<boolean>('window.matchMedia("(prefers-color-scheme: dark)").matches');
  expect(isDark).toBe(true);
});

test('emulateMedia print media matches media query', async ({ page }) => {
  await page.go(URL);
  await page.emulateMedia({ media: 'print' });
  const isPrint = await page.evaluate<boolean>('window.matchMedia("print").matches');
  expect(isPrint).toBe(true);
});

test('a11yTree returns a non-empty accessibility tree', async ({ page }) => {
  await page.go(URL);
  const tree = await page.a11yTree();
  expect(tree).toBeDefined();
  expect(tree.role).toBeTruthy();
  expect((tree.children ?? []).length).toBeGreaterThan(0);
});

test('frames returns child frame pages', async ({ page }) => {
  await page.go(FRAMES_URL);
  const frames = await page.frames();
  expect(frames.length).toBeGreaterThan(0);
});

test('frame finds a frame by URL substring', async ({ page }) => {
  await page.go(FRAMES_URL);
  const frame = await page.frame('frame-top');
  expect(frame).not.toBeNull();
});

test('bringToFront does not throw', async ({ page }) => {
  await page.go(URL);
  await page.bringToFront();
});
