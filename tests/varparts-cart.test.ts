import { expect } from 'vitest';
import { test } from '../src';

const BASE = 'https://var.parts';

// Cart is React state — must navigate via SPA links after adding items,
// not via page.go('/cart'), or the cart state is lost.

test('cart is empty on initial visit', async ({ page }) => {
  await page.go(`${BASE}/cart`);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Your cart is empty');
});

test('Add to Cart shows success toast', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Added to cart');
});

test('cart badge increments after adding an item', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.querySelector('a[href="/cart"]')?.textContent?.includes('1')`, { timeout: 4000 });
  const badge = await page.find('a[href="/cart"]');
  await expect(badge).toHaveText('1');
});

test('cart shows added item when navigating via nav link', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Gripper End-Effector');
  expect(body).toContain('1 item in your cart');
});

test('cart shows correct subtotal for added item', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('149.99');
});

test('clear cart empties the cart', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  await page.find({ text: 'Clear Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Your cart is empty')`, { timeout: 4000 });
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Your cart is empty');
});

test('adding two different products shows 2 items in cart', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.go(`${BASE}/product/12`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.waitUntil(`document.body.textContent.includes('Added to cart')`, { timeout: 4000 });
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('2 items in your cart');
});
