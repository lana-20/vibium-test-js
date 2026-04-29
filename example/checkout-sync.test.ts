import { test } from '../src/index';
import type { PageSync, ElementSync } from 'vibium/sync';

// For sync tests, build selector helpers directly on PageSync —
// PageObject base is typed for the async Page, so skip it here.
function cartHelpers(page: PageSync) {
  return {
    item: (name: string): ElementSync => page.find({ role: 'listitem', text: name }),
    removeBtn: (name: string): ElementSync => page.find({ role: 'button', text: `Remove ${name}` }),
    total: (): ElementSync => page.find({ testid: 'cart-total' }),
  };
}

test.sync('remove item updates total', ({ page }) => {
  page.go('/cart');
  const cart = cartHelpers(page);
  cart.item('Widget').click();
  cart.removeBtn('Widget').click();

  const totalText = cart.total().text();
  if (totalText.includes('Widget')) {
    throw new Error(`Expected total not to mention Widget, got: "${totalText}"`);
  }
});

test.sync.skip('placeholder for future sync test', ({ page }) => {
  page.go('/');
});
