import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/button-demo';

test('click counter increments on primary button click', async ({ page }) => {
  await page.go(URL);
  await page.find('#primary-button').click();
  const counter = await page.find('#click-counter');
  await expect(counter).toHaveText('1');
});

test('primary button shows activated state after click', async ({ page }) => {
  await page.go(URL);
  await page.find('#primary-button').click();
  const btn = await page.find('#primary-button');
  await expect(btn).toHaveText('Primary Button (ACTIVATED)');
});

test('multiple button clicks accumulate in counter', async ({ page }) => {
  await page.go(URL);
  await page.find('#primary-button').click();
  await page.find('#secondary-button').click();
  await page.find('#outline-button').click();
  const counter = await page.find('#click-counter');
  await expect(counter).toHaveText('3');
});

test('disabled button is not enabled', async ({ page }) => {
  await page.go(URL);
  const btn = await page.find('#disabled-button');
  await expect(btn).toBeDisabled();
});

test('reset clears counter and restores button labels', async ({ page }) => {
  await page.go(URL);
  await page.find('#primary-button').click();
  await page.find('#secondary-button').click();
  await page.find('#reset-button').click();
  const counter = await page.find('#click-counter');
  await expect(counter).toHaveText('0');
  const btn = await page.find('#primary-button');
  await expect(btn).toHaveText('Primary Button');
});
