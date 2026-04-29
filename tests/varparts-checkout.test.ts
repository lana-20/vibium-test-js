import { expect } from 'vitest';
import { test } from '../src';

const BASE = 'https://var.parts';

async function addToCartAndGoToCheckout(page: import('vibium').Page) {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  await page.find('a[href="/checkout"]').click();
  await page.waitUntil.url('/checkout');
}

test('checkout page shows delivery address form', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  const unitField = await page.find('#name');
  const bayField = await page.find('#bay');
  await expect(unitField).toBeVisible();
  await expect(bayField).toBeVisible();
});

test('checkout page shows two shipping options', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  const lunar = await page.find('#lunar');
  const interplanetary = await page.find('#interplanetary');
  await expect(lunar).toBeVisible();
  await expect(interplanetary).toBeVisible();
});

test('checkout shows order summary with correct item', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Gripper End-Effector');
  expect(body).toContain('149.99');
});

test('filling delivery form and submitting reaches payment page', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await page.find('#name').fill('VAR-402');
  await page.find('#bay').fill('Bay 7-A');
  await page.find({ text: 'Proceed to Payment' }).click();
  await page.waitUntil(`document.body.textContent.includes('Complete Payment')`, { timeout: 5000 });
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Complete Payment');
  expect(body).toContain('VAR-402');
  expect(body).toContain('Bay 7-A');
});

test('payment page has Pay Now button and order number', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await page.find('#name').fill('VAR-402');
  await page.find('#bay').fill('Bay 7-A');
  await page.find({ text: 'Proceed to Payment' }).click();
  await page.waitUntil(`document.body.textContent.includes('Complete Payment')`, { timeout: 5000 });
  const btn = await page.find({ text: 'Pay Now' });
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/Order #[A-Z0-9]+/);
});

test('paying shows order confirmation', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await page.find('#name').fill('VAR-402');
  await page.find('#bay').fill('Bay 7-A');
  await page.find({ text: 'Proceed to Payment' }).click();
  await page.waitUntil(`document.body.textContent.includes('Complete Payment')`, { timeout: 5000 });
  await page.find({ text: 'Pay Now' }).click();
  await page.waitUntil(`document.body.textContent.includes('Payment Received')`, { timeout: 5000 });
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Payment Received');
  expect(body).toContain('Bay 7-A');
});

test('interplanetary shipping is selectable', async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await page.find('#interplanetary').click();
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/149\.99/);
});
