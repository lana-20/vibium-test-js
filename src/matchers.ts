import type { Element, Page } from 'vibium';

interface MatchResult {
  pass: boolean;
  message: () => string;
}

function pass(msg: string): MatchResult {
  return { pass: true, message: () => msg };
}

function fail(msg: string): MatchResult {
  return { pass: false, message: () => msg };
}

export const matchers = {
  async toBeVisible(el: Element): Promise<MatchResult> {
    const visible = await el.isVisible();
    return visible
      ? pass('Expected element not to be visible')
      : fail('Expected element to be visible');
  },

  async toBeHidden(el: Element): Promise<MatchResult> {
    const hidden = await el.isHidden();
    return hidden
      ? pass('Expected element not to be hidden')
      : fail('Expected element to be hidden');
  },

  async toBeEnabled(el: Element): Promise<MatchResult> {
    const enabled = await el.isEnabled();
    return enabled
      ? pass('Expected element not to be enabled')
      : fail('Expected element to be enabled');
  },

  async toBeDisabled(el: Element): Promise<MatchResult> {
    const enabled = await el.isEnabled();
    return !enabled
      ? pass('Expected element not to be disabled')
      : fail('Expected element to be disabled');
  },

  async toBeChecked(el: Element): Promise<MatchResult> {
    const checked = await el.isChecked();
    return checked
      ? pass('Expected element not to be checked')
      : fail('Expected element to be checked');
  },

  async toHaveText(el: Element, expected: string | RegExp): Promise<MatchResult> {
    const actual = await el.text();
    const matches =
      expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);
    return matches
      ? pass(`Expected element not to have text matching ${expected}`)
      : fail(`Expected element to have text matching ${expected}, got: "${actual}"`);
  },

  async toHaveAttribute(el: Element, name: string, value?: string): Promise<MatchResult> {
    const actual = await el.getAttribute(name);
    if (value === undefined) {
      return actual !== null
        ? pass(`Expected element not to have attribute "${name}"`)
        : fail(`Expected element to have attribute "${name}"`);
    }
    return actual === value
      ? pass(`Expected element not to have attribute "${name}"="${value}"`)
      : fail(`Expected element to have attribute "${name}"="${value}", got: "${actual}"`);
  },

  async toHaveURL(page: Page, expected: string | RegExp): Promise<MatchResult> {
    const actual = await page.url();
    const matches =
      expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);
    return matches
      ? pass(`Expected page not to have URL matching ${expected}`)
      : fail(`Expected page to have URL matching ${expected}, got: "${actual}"`);
  },

  async toHaveTitle(page: Page, expected: string | RegExp): Promise<MatchResult> {
    const actual = await page.title();
    const matches =
      expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);
    return matches
      ? pass(`Expected page not to have title matching ${expected}`)
      : fail(`Expected page to have title matching ${expected}, got: "${actual}"`);
  },

  async toHaveCount(elements: Element[], expected: number): Promise<MatchResult> {
    const actual = elements.length;
    return actual === expected
      ? pass(`Expected not to have ${expected} elements`)
      : fail(`Expected ${expected} elements, got ${actual}`);
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerMatchers(expectFn: { extend: (m: Record<string, any>) => void }): void {
  expectFn.extend(matchers);
}
