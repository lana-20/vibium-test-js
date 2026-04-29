import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/checkbox-radio-demo';

test('basic checkbox is unchecked initially', async ({ page }) => {
  await page.go(URL);
  const checkbox = await page.find('#basic-checkbox');
  expect(await checkbox.getAttribute('aria-checked')).toBe('false');
});

test('clicking checkbox toggles it to checked', async ({ page }) => {
  await page.go(URL);
  await page.find('#basic-checkbox').click();
  const checkbox = await page.find('#basic-checkbox');
  expect(await checkbox.getAttribute('aria-checked')).toBe('true');
});

test('clicking checked checkbox toggles it back to unchecked', async ({ page }) => {
  await page.go(URL);
  await page.find('#basic-checkbox').click();
  await page.find('#basic-checkbox').click();
  const checkbox = await page.find('#basic-checkbox');
  expect(await checkbox.getAttribute('aria-checked')).toBe('false');
});

test('selecting a plan radio deselects others', async ({ page }) => {
  await page.go(URL);
  await page.find('#basic').click();
  await page.find('#pro').click();
  const basic = await page.find('#basic');
  const pro = await page.find('#pro');
  expect(await basic.getAttribute('aria-checked')).toBe('false');
  expect(await pro.getAttribute('aria-checked')).toBe('true');
});

test('only one color radio can be selected at a time', async ({ page }) => {
  await page.go(URL);
  await page.find('#red').click();
  await page.find('#blue').click();
  const red = await page.find('#red');
  const blue = await page.find('#blue');
  expect(await red.getAttribute('aria-checked')).toBe('false');
  expect(await blue.getAttribute('aria-checked')).toBe('true');
});

test('newsletter preference checkbox is independent of others', async ({ page }) => {
  await page.go(URL);
  await page.find('#newsletter').click();
  await page.find('#updates').click();
  const newsletter = await page.find('#newsletter');
  const updates = await page.find('#updates');
  expect(await newsletter.getAttribute('aria-checked')).toBe('true');
  expect(await updates.getAttribute('aria-checked')).toBe('true');
});
