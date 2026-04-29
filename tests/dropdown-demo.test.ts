import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/dropdown-demo';

test('native select reflects chosen option', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('Automated Operation');
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('Automated Operation');
});

test('native select can switch between options', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('Manual Control');
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('Manual Control');
});

test('reset clears native select to default', async ({ page }) => {
  await page.go(URL);
  await page.find('#native-select').selectOption('Emergency Override');
  await page.find('#reset-selections').click();
  const select = await page.find('#native-select');
  expect(await select.value()).toBe('');
});
