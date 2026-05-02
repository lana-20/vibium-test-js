import { expect } from 'vitest';
import { test } from '../src';

const ALERTS = 'https://the-internet.herokuapp.com/javascript_alerts';
const URL = 'https://testtrack.org';

test('onDialog handles alert and accepts', async ({ page }) => {
  await page.go(ALERTS);
  let message = '';
  page.onDialog(async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  await page.find({ role: 'button', text: 'Click for JS Alert' }).click();
  expect(message).toBe('I am a JS Alert');
});

test('onDialog handles confirm and dismisses', async ({ page }) => {
  await page.go(ALERTS);
  let type = '';
  page.onDialog(async (dialog) => {
    type = dialog.type();
    await dialog.dismiss();
  });
  await page.find({ role: 'button', text: 'Click for JS Confirm' }).click();
  expect(type).toBe('confirm');
});

test('onDialog handles prompt and reads message', async ({ page }) => {
  await page.go(ALERTS);
  let msg = '';
  page.onDialog(async (dialog) => {
    msg = dialog.message();
    await dialog.accept('vibium');
  });
  await page.find({ role: 'button', text: 'Click for JS Prompt' }).click();
  expect(msg).toBe('I am a JS prompt');
});

test('capture.dialog holds dialog open for inspection', async ({ page }) => {
  await page.go(ALERTS);
  const dialog = await page.capture.dialog(async () => {
    page.find({ role: 'button', text: 'Click for JS Confirm' }).click().catch(() => {});
  });
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toBe('I am a JS Confirm');
  await dialog.dismiss();
});

test('capture.navigation resolves with new URL after click', async ({ page }) => {
  await page.go('https://the-internet.herokuapp.com');
  const newUrl = await page.capture.navigation(async () => {
    await page.find({ role: 'link', text: 'JavaScript Alerts' }).click();
  });
  expect(newUrl).toContain('javascript_alerts');
});

test('onConsole with collect buffers console messages', async ({ page }) => {
  await page.go(URL);
  page.onConsole('collect');
  await page.evaluate<void>('console.log("vibium-console-test")');
  await page.wait(200);
  const msgs = page.consoleMessages();
  expect(msgs.some((m) => m.text === 'vibium-console-test')).toBe(true);
});

test('onError with collect buffers uncaught page errors', async ({ page }) => {
  await page.go(URL);
  page.onError('collect');
  await page.evaluate<void>('setTimeout(() => { throw new Error("vibium-error-test") }, 50)');
  await page.wait(300);
  const errs = page.errors();
  expect(errs.some((e) => e.message.includes('vibium-error-test'))).toBe(true);
});

test('removeAllListeners stops dialog handler from being called', async ({ page }) => {
  await page.go(ALERTS);
  let called = false;
  page.onDialog(async (dialog) => {
    called = true;
    await dialog.accept();
  });
  page.removeAllListeners('dialog');
  page.find({ role: 'button', text: 'Click for JS Alert' }).click().catch(() => {});
  await page.wait(2000);
  expect(called).toBe(false);
});
