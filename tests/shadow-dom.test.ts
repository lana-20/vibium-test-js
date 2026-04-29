import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://the-internet.herokuapp.com/shadowdom';

test('page contains two shadow host elements', async ({ page }) => {
  await page.go(URL);
  const count = await page.evaluate<number>(`document.querySelectorAll('my-paragraph').length`);
  expect(count).toBe(2);
});

test('shadow roots are open mode', async ({ page }) => {
  await page.go(URL);
  const modes = await page.evaluate<string[]>(
    `[...document.querySelectorAll('my-paragraph')].map(h => h.shadowRoot ? h.shadowRoot.mode : null)`
  );
  expect(modes).toEqual(['open', 'open']);
});

test('shadow paragraph contains default text', async ({ page }) => {
  await page.go(URL);
  const text = await page.evaluate<string>(
    `document.querySelector('my-paragraph').shadowRoot.querySelector('p').textContent.trim()`
  );
  expect(text).toBe('My default text');
});

test('shadow root has scoped style with white text on grey background', async ({ page }) => {
  await page.go(URL);
  const style = await page.evaluate<string>(
    `document.querySelector('my-paragraph').shadowRoot.querySelector('style').textContent`
  );
  expect(style).toContain('color: white');
  expect(style).toContain('background-color: #666');
});

test('slot projects first host light DOM span into shadow tree', async ({ page }) => {
  await page.go(URL);
  const slotted = await page.evaluate<string>(
    `document.querySelectorAll('my-paragraph')[0].querySelector('span').textContent.trim()`
  );
  expect(slotted).toBe("Let's have some different text!");
});

test('slot projects second host light DOM list into shadow tree', async ({ page }) => {
  await page.go(URL);
  const itemCount = await page.evaluate<number>(
    `document.querySelectorAll('my-paragraph')[1].querySelectorAll('li').length`
  );
  expect(itemCount).toBe(2);
});

test('shadow content is not reachable by standard CSS selector', async ({ page }) => {
  await page.go(URL);
  const pierced = await page.evaluate<boolean>(
    `document.querySelector('my-paragraph p') === null`
  );
  expect(pierced).toBe(true);
});

test('both shadow roots share identical internal structure', async ({ page }) => {
  await page.go(URL);
  const json = await page.evaluate<string>(
    `JSON.stringify([...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName)))`
  );
  const structures = JSON.parse(json) as string[][];
  expect(structures[0]).toEqual(['STYLE', 'P']);
  expect(structures[1]).toEqual(['STYLE', 'P']);
});
