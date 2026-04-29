import { expect } from 'vitest';
import { test } from '../src';

const BASE = 'https://var.parts';

test('homepage shows product grid', async ({ page }) => {
  await page.go(BASE);
  const products = await page.findAll('[data-item="product"]');
  await expect(products).toHaveCount(12);
});

test('each product card shows a name and price', async ({ page }) => {
  await page.go(BASE);
  const first = await page.find('[data-testid="product-gripper-end-effector"]');
  await expect(first).toHaveText('Gripper End-Effector');
  await expect(first).toHaveText('149.99');
});

test('clicking a product card navigates to its detail page', async ({ page }) => {
  await page.go(BASE);
  await page.find({ text: 'Gripper End-Effector' }).click();
  await page.waitUntil.url('/product/');
  await expect(page).toHaveURL('/product/3');
  await expect(page).toHaveTitle(/Gripper End-Effector/);
});

test('product detail page shows description and Add to Cart button', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  const heading = await page.find({ role: 'heading', text: 'Gripper End-Effector' });
  await expect(heading).toBeVisible();
  const btn = await page.find({ text: 'Add to Cart' });
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
});

test('product detail page shows compatible components', async ({ page }) => {
  await page.go(`${BASE}/product/3`);
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/Compatible Components/i);
});

test('about page loads with FAQ section', async ({ page }) => {
  await page.go(`${BASE}/about`);
  await expect(page).toHaveURL('/about');
  const body = await page.evaluate<string>(`document.body.textContent`);
  expect(body).toMatch(/FAQ/i);
  expect(body).toContain('test storefront');
});

test('nav links are present on every page', async ({ page }) => {
  for (const url of [`${BASE}/`, `${BASE}/product/3`, `${BASE}/about`]) {
    await page.go(url);
    const shop = await page.find({ text: 'Shop' });
    const about = await page.find({ text: 'About' });
    await expect(shop).toBeVisible();
    await expect(about).toBeVisible();
  }
});
