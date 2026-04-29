import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/dropdown-demo';

test('native select reflects chosen option', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('auto');
  await page.wait(500);
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('auto');
});

test('native select can switch between options', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('manual');
  await page.wait(500);
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('manual');
});

test('reset clears native select to default', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('override');
  await page.find('#reset-selections').click();
  await page.wait(500);
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('');
});
