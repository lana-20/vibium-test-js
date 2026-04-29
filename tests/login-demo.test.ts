import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org/login-demo';

test('valid credentials authenticate successfully', async ({ page }) => {
  await page.go(URL);
  await page.find('#username').fill('testuser');
  await page.find('#password').fill('password123');
  await page.find('#login-submit').click();
  await page.wait(4000);
  const status = await page.find('#login-status');
  await expect(status).toHaveText('AUTHENTICATED');
});

test('invalid credentials show access denied', async ({ page }) => {
  await page.go(URL);
  await page.find('#username').fill('baduser');
  await page.find('#password').fill('wrongpass');
  await page.find('#login-submit').click();
  await page.wait(4000);
  const status = await page.find('#login-status');
  await expect(status).toHaveText('ACCESS DENIED');
});

test('attempt counter increments on each submit', async ({ page }) => {
  await page.go(URL);
  await page.find('#username').fill('a');
  await page.find('#password').fill('b');
  await page.find('#login-submit').click();
  await page.wait(4000);
  const attempts = await page.find('#login-attempts');
  await expect(attempts).toHaveText('1');
});

test('load demo credentials fills username and password', async ({ page }) => {
  await page.go(URL);
  await page.find('#fill-demo-credentials').click();
  const username = await page.find('#username');
  expect(await username.value()).toBe('testuser');
  const password = await page.find('#password');
  expect(await password.value()).toBe('password123');
});

test('reset clears form fields and status', async ({ page }) => {
  await page.go(URL);
  await page.find('#fill-demo-credentials').click();
  await page.find('#reset-form').click();
  const username = await page.find('#username');
  expect(await username.value()).toBe('');
  const status = await page.find('#login-status');
  await expect(status).toHaveText('STANDBY');
});
