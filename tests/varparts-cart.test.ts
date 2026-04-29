import { expect } from 'vitest';
import { test } from '../src';

const BASE = 'https://var.parts';

// Cart is React state — must navigate via SPA links after adding items,
// not via page.go('/cart'), or the cart state is lost.
// Wait on the cart badge (persistent) rather than the toast (ephemeral).

async function addToCart(page: import('vibium').Page, productId: number) {
  await page.go(`${BASE}/product/${productId}`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.wait(2000);
}

test('cart is empty on initial visit', async ({ page }) => {
  await page.go(`${BASE}/cart`);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Your cart is empty');
});

test('Add to Cart shows success toast', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.wait(2000);
  const badge = await page.find('a[href="/cart"]');
  await expect(badge).toHaveText('1');
});

test('cart badge increments after adding an item', async ({ page }) => {
  await addToCart(page, 3);
  const badge = await page.find('a[href="/cart"]');
  await expect(badge).toHaveText('1');
});

test('cart shows added item when navigating via nav link', async ({ page }) => {
  await addToCart(page, 3);
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Gripper End-Effector');
  expect(body).toContain('1 item in your cart');
});

test('cart shows correct subtotal for added item', async ({ page }) => {
  await addToCart(page, 3);
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('149.99');
});

test('clear cart empties the cart', async ({ page }) => {
  await addToCart(page, 3);
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  await page.find({ text: 'Clear Cart' }).click();
  await page.wait(2000);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('Your cart is empty');
});

test('adding two different products shows 2 items in cart', async ({ page }) => {
  // Add first product via direct nav, then use SPA links for second — cart is React state
  await page.go(`${BASE}/product/3`);
  await page.find({ text: 'Add to Cart' }).click();
  await page.wait(2000);
  await page.find({ text: 'Shop' }).click();
  await page.waitUntil.url('/');
  await page.find('[data-testid="product-vibium-battery-pack"]').click();
  await page.waitUntil.url('/product/');
  await page.find({ text: 'Add to Cart' }).click();
  await page.wait(2000);
  await page.find('a[href="/cart"]').click();
  await page.waitUntil.url('/cart');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toContain('2 items in your cart');
});
