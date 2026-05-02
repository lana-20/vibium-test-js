import { expect } from 'vitest';
import { test } from '../src';

const KEYPRESSES = 'https://the-internet.herokuapp.com/key_presses';
const URL = 'https://testtrack.org';

// Keyboard

test('keyboard.press sends a key and key code appears in result', async ({ page }) => {
  await page.go(KEYPRESSES);
  const input = await page.find('input');
  await input.focus();
  await page.keyboard.press('A');
  const result = await page.evaluate<string>('document.querySelector("#result").textContent');
  expect(result).toContain('A');
});

test('keyboard.type types a string character by character', async ({ page }) => {
  await page.setContent('<html><body><input id="i" /></body></html>');
  const input = await page.find('#i');
  await input.focus();
  await page.keyboard.type('hello');
  expect(await input.value()).toBe('hello');
});

test('keyboard.down and keyboard.up produce uppercase with Shift', async ({ page }) => {
  await page.setContent('<html><body><input id="i" /></body></html>');
  const input = await page.find('#i');
  await input.focus();
  await page.keyboard.down('Shift');
  await page.keyboard.press('a');
  await page.keyboard.up('Shift');
  expect(await input.value()).toBe('A');
});

// Mouse

test('mouse.click fires click at coordinates', async ({ page }) => {
  await page.setContent(`<html><body style="padding:0;margin:0">
    <button id="b" style="position:absolute;top:10px;left:10px;width:100px;height:40px"
      onclick="this.textContent='clicked'">no</button>
  </body></html>`);
  await page.mouse.click(60, 30);
  await page.wait(100);
  expect(await page.evaluate<string>('document.querySelector("#b").textContent')).toBe('clicked');
});

test('mouse.move moves mouse to coordinates without throwing', async ({ page }) => {
  await page.go(URL);
  await page.mouse.move(200, 200);
});

test('mouse.down and mouse.up work without throwing', async ({ page }) => {
  await page.go(URL);
  await page.mouse.move(200, 200);
  await page.mouse.down();
  await page.mouse.up();
});

test('mouse.wheel scrolls the page', async ({ page }) => {
  await page.go(URL);
  await page.mouse.wheel(0, 400);
  const scrollY = await page.evaluate<number>('window.scrollY');
  expect(scrollY).toBeGreaterThan(0);
});

// Touch

test('touch.tap fires click event at coordinates', async ({ page }) => {
  await page.setContent(`<html><body style="padding:0;margin:0">
    <button id="b" style="position:absolute;top:10px;left:10px;width:100px;height:40px"
      onclick="this.textContent='tapped'">no</button>
  </body></html>`);
  await page.touch.tap(60, 30);
  await page.wait(200);
  expect(await page.evaluate<string>('document.querySelector("#b").textContent')).toBe('tapped');
});

// Clock

test('clock.install fixes Date.now() to given time', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  const ts = await page.evaluate<number>('Date.now()');
  expect(ts).toBe(1704067200000);
});

test('clock.fastForward advances fake time by given ticks', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.clock.fastForward(3_600_000);
  const ts = await page.evaluate<number>('Date.now()');
  expect(ts).toBe(1704067200000 + 3_600_000);
});

test('clock.runFor fires timers within the tick range', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.evaluate<void>('window.__timerFired = false; setTimeout(() => { window.__timerFired = true; }, 500)');
  await page.clock.runFor(1000);
  expect(await page.evaluate<boolean>('window.__timerFired')).toBe(true);
});

test('clock.setFixedTime freezes Date.now()', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.clock.setFixedTime('2024-06-15T12:00:00.000Z');
  const t1 = await page.evaluate<number>('Date.now()');
  await page.wait(150);
  const t2 = await page.evaluate<number>('Date.now()');
  expect(t1).toBe(t2);
  expect(t1).toBe(new Date('2024-06-15T12:00:00.000Z').getTime());
});

test('clock.setSystemTime changes Date.now() without affecting installed clock', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.clock.setSystemTime('2025-03-01T00:00:00.000Z');
  const ts = await page.evaluate<number>('Date.now()');
  expect(ts).toBe(new Date('2025-03-01T00:00:00.000Z').getTime());
});

test('clock.pauseAt freezes time at the specified point', async ({ page }) => {
  await page.go(URL);
  await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
  await page.clock.pauseAt('2024-01-01T06:00:00.000Z');
  const ts = await page.evaluate<number>('Date.now()');
  expect(ts).toBe(new Date('2024-01-01T06:00:00.000Z').getTime());
  await page.clock.resume();
});

test('clock.setTimezone overrides to UTC giving zero offset', async ({ page }) => {
  await page.go(URL);
  await page.clock.setTimezone('UTC');
  const offset = await page.evaluate<number>('new Date().getTimezoneOffset()');
  expect(offset).toBe(0);
});
