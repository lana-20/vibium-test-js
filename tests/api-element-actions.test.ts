import { expect } from 'vitest';
import { test } from '../src';

const BUTTON = 'https://testtrack.org/button-demo';
const LOGIN = 'https://testtrack.org/login-demo';
const DROPDOWN = 'https://testtrack.org/dropdown-demo';
const DRAG = 'https://the-internet.herokuapp.com/drag_and_drop';
const UPLOAD = 'https://the-internet.herokuapp.com/upload';

test('click invokes element click action', async ({ page }) => {
  await page.go(BUTTON);
  await page.find('#primary-button').click();
  const counter = await page.find('#click-counter');
  expect(await counter.text()).toBe('1');
});

test('dblclick fires dblclick event', async ({ page }) => {
  await page.setContent('<html><body><div id="d" ondblclick="this.textContent=\'dbl\'">no</div></body></html>');
  await page.find('#d').dblclick();
  expect(await page.evaluate<string>('document.querySelector("#d").textContent')).toBe('dbl');
});

test('fill clears and sets input value', async ({ page }) => {
  await page.go(LOGIN);
  const input = await page.find('#username');
  await input.fill('test@example.com');
  expect(await input.value()).toBe('test@example.com');
});

test('type appends to existing input value', async ({ page }) => {
  await page.go(LOGIN);
  const input = await page.find('#username');
  await input.fill('hello');
  await input.type(' world');
  expect(await input.value()).toBe('hello world');
});

test('clear empties input value', async ({ page }) => {
  await page.go(LOGIN);
  const input = await page.find('#username');
  await input.fill('some text');
  await input.clear();
  expect(await input.value()).toBe('');
});

test('press Tab moves focus to next element', async ({ page }) => {
  await page.go(LOGIN);
  const input = await page.find('#username');
  await input.focus();
  await input.press('Tab');
  const tag = await page.evaluate<string>('document.activeElement?.tagName');
  expect(tag).not.toBe('BODY');
});

test('check marks a native checkbox', async ({ page }) => {
  await page.setContent('<html><body><input type="checkbox" id="cb" /></body></html>');
  const cb = await page.find('#cb');
  await cb.check();
  expect(await cb.isChecked()).toBe(true);
});

test('uncheck unmarks a native checkbox', async ({ page }) => {
  await page.setContent('<html><body><input type="checkbox" id="cb" checked /></body></html>');
  const cb = await page.find('#cb');
  await cb.uncheck();
  expect(await cb.isChecked()).toBe(false);
});

test('selectOption picks dropdown option by value', async ({ page }) => {
  await page.go(DROPDOWN);
  const sel = await page.find('#native-select');
  await sel.selectOption('auto');
  expect(await sel.value()).toBe('auto');
});

test('hover moves mouse to element center', async ({ page }) => {
  await page.go(BUTTON);
  await page.find('#primary-button').hover();
});

test('focus focuses the element', async ({ page }) => {
  await page.go(LOGIN);
  await page.find('#username').focus();
  expect(await page.evaluate<string>('document.activeElement.id')).toBe('username');
});

test('scrollIntoView scrolls element into the viewport', async ({ page }) => {
  await page.setContent(`<html><body>
    <p id="bottom" style="margin-top:2500px">Bottom</p>
  </body></html>`);
  const bottom = await page.find('#bottom');
  await bottom.scrollIntoView();
  const scrollY = await page.evaluate<number>('window.scrollY');
  expect(scrollY).toBeGreaterThan(0);
});

test('dispatchEvent fires synthetic DOM event', async ({ page }) => {
  await page.setContent('<html><body><div id="t" onclick="this.textContent=\'fired\'">no</div></body></html>');
  await page.find('#t').dispatchEvent('click');
  expect(await page.evaluate<string>('document.querySelector("#t").textContent')).toBe('fired');
});

test('tap performs touch tap on element', async ({ page }) => {
  await page.setContent('<html><body style="padding:0;margin:0"><button id="b" onclick="this.textContent=\'tapped\'">no</button></body></html>');
  await page.find('#b').tap();
  await page.wait(200);
  expect(await page.evaluate<string>('document.querySelector("#b").textContent')).toBe('tapped');
});

test('dragTo moves element to target', async ({ page }) => {
  await page.go(DRAG);
  const colA = await page.find('#column-a');
  const colB = await page.find('#column-b');
  const before = await page.evaluate<string>('document.querySelector("#column-a header").textContent.trim()');
  await colA.dragTo(colB);
  const after = await page.evaluate<string>('document.querySelector("#column-a header").textContent.trim()');
  expect(after).not.toBe(before);
});

test('setFiles sets file on file input', async ({ page }) => {
  await page.go(UPLOAD);
  const input = await page.find('input[type=file]');
  await input.setFiles(['/etc/hosts']);
  expect((await input.value()).length).toBeGreaterThan(0);
});

test('element.waitUntil resolves for already-visible element', async ({ page }) => {
  await page.go('https://testtrack.org');
  const h1 = await page.find('h1');
  await h1.waitUntil('visible');
});
