# Vibium JS Client — Bug Report

**Package:** `vibium` JS client  
**Version:** 26.3.18  
**Platform:** macOS x86_64 (Darwin 25.3.0)  
**Node:** v25.8.0  
**Test runner:** Vitest 2.1.9, `pool: forks`  
**Repro repo:** https://github.com/lana-20/vibium-test-js  
**Date:** 2026-05-01

---

## Bug 1 — `page.waitUntil(expression)` always times out

### Summary

`page.waitUntil(expression, options)` throws a timeout error for every JS expression passed to it, including expressions that are immediately and unconditionally true on a fully-loaded page. The method never resolves.

`page.waitUntil.url()` is unaffected and works correctly. The fault is isolated to the expression-based overload.

### Steps to reproduce

```ts
await page.go('https://the-internet.herokuapp.com/shadowdom');
await page.waitUntil.url('shadowdom');          // PASSES — page is fully loaded

// document.readyState is already "complete" — should resolve instantly
await page.waitUntil(`document.readyState === "complete"`, { timeout: 5000 });
// → throws: "timeout: timeout waiting for function to return truthy"
```

A second variant with a present element:

```ts
await page.go('https://the-internet.herokuapp.com/shadowdom');
await page.waitUntil(`!!document.querySelector('my-paragraph')`, { timeout: 5000 });
// → throws: "timeout: timeout waiting for function to return truthy"
// (my-paragraph is present on the page — querySelector returns a non-null element)
```

### Actual error

```
Error: timeout: timeout waiting for function to return truthy
 ❯ _BiDiClient.handleResponse dist/index.mjs:313:22
```

The error originates in `_BiDiClient.handleResponse` when the `vibium:page.waitForFunction` BiDi command is rejected by the browser with a timeout response. The expression is never evaluated to a truthy result.

### Expected behaviour

`page.waitUntil(expression)` should poll the expression in the page context and resolve as soon as it returns truthy. For an immediately-true expression like `document.readyState === "complete"` on an already-loaded page, it should resolve in under 100ms.

### Impact

Unusable in practice. Every test suite that relied on `page.waitUntil(expression)` had to be rewritten to use `page.wait(ms)` fixed delays. This loses the semantic guarantee that a condition is actually met and introduces arbitrary timing dependencies.

### Workaround

Replace with `page.wait(ms)`. Timing must be determined empirically per interaction:

```ts
// Before (broken)
await page.waitUntil(`document.querySelector('#result') !== null`, { timeout: 8000 });

// After (workaround)
await page.wait(5000);
```

### Repro file

`tests/repro-bug1-waituntil-expression.test.ts`

Run with:
```sh
VIBIUM_BIN_PATH=<path-to-vibium-binary> npx vitest run tests/repro-bug1-waituntil-expression.test.ts
```

Expected result: 1 pass (baseline), 2 fail (the two bug cases).

---

## Bug 2 — `page.evaluate()` wraps nested array strings as BiDi typed objects

### Summary

When a JS expression passed to `page.evaluate()` returns a nested array (`string[][]`), the items inside the inner arrays are deserialized as BiDi typed objects `{ type: "string", value: "..." }` instead of plain JS strings.

A flat `string[]` return value deserializes correctly. The issue affects only the second (and deeper) level of nesting.

### Steps to reproduce

```ts
await page.go('https://the-internet.herokuapp.com/shadowdom');

// Flat string[] — works correctly
const modes = await page.evaluate<string[]>(
  `[...document.querySelectorAll('my-paragraph')].map(h => h.shadowRoot.mode)`
);
console.log(modes[0]); // "open" ✓

// Nested string[][] — broken
const structures = await page.evaluate<string[][]>(
  `[...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName))`
);
console.log(structures[0][0]);
// Expected: "STYLE"
// Actual:   { type: "string", value: "STYLE" }
```

### Actual vs expected

```
Expected: "STYLE"

Received: Object {
  "type": "string",
  "value": "STYLE",
}
```

The outer array (`structures`) is a plain JS array. The inner arrays (`structures[0]`, `structures[1]`) are also plain arrays. Only their string elements are wrapped as BiDi typed descriptors instead of being unwrapped to primitive values.

### Root cause hypothesis

The BiDi result deserializer correctly unwraps the outermost remote value but does not recursively unwrap primitive values within nested arrays. The inner array items are left in their raw BiDi `{type, value}` form.

### Workaround

Round-trip through `JSON.stringify` inside the eval expression, then `JSON.parse` on the receiving side:

```ts
const json = await page.evaluate<string>(
  `JSON.stringify([...document.querySelectorAll('my-paragraph')].map(h => [...h.shadowRoot.children].map(c => c.tagName)))`
);
const structures = JSON.parse(json) as string[][];
// structures[0][0] === "STYLE" ✓
```

### Repro file

`tests/repro-bug2-evaluate-nested-array.test.ts`

Run with:
```sh
VIBIUM_BIN_PATH=<path-to-vibium-binary> npx vitest run tests/repro-bug2-evaluate-nested-array.test.ts
```

Expected result: 2 pass (baseline + workaround), 1 fail (the bug case).

---

## Bug 3 — `clock.setFixedTime()` silently does nothing without prior `clock.install()`

### Summary

Calling `page.clock.setFixedTime(time)` without first calling `page.clock.install()` has no observable effect. `Date.now()` continues returning live system time. No error is thrown, so callers have no indication the call failed.

### Steps to reproduce

```ts
await page.go('https://testtrack.org');
await page.clock.setFixedTime('2020-01-01T00:00:00.000Z');
const ts = await page.evaluate<number>('Date.now()');
// Expected: 1577836800000
// Actual:   ~1777686857749  (live system time, May 2026)
```

Confirmed on three independent origins: testtrack.org, the-internet.herokuapp.com, example.com.

### Actual vs expected

| | Value |
|---|---|
| Expected | `1577836800000` (2020-01-01 00:00:00 UTC) |
| Actual | live system time (`Date.now()` advancing normally) |
| Error thrown | none |

### Root cause

The JS client sends `vibium:clock.setFixedTime`. The Go handler evaluates `window.__vibiumClock.setFixedTime(time)` in the page. `window.__vibiumClock` is only injected by `clock.install()` — without it the expression throws a ReferenceError, which is caught internally and the handler returns success anyway, masking the failure.

### Workaround

Always call `clock.install()` before `setFixedTime()`:

```ts
await page.clock.install({ time: '2024-01-01T00:00:00.000Z' });
await page.clock.setFixedTime('2020-01-01T00:00:00.000Z');
const ts = await page.evaluate<number>('Date.now()');
// ts === 1577836800000 ✓
```

### Comparison with Playwright

Playwright's `page.clock.setFixedTime()` works standalone — `install()` is not required. Vibium should match this behaviour, or at minimum throw an error when called without `install()`.

### Repro file

`tests/repro-bug3-clock-setfixedtime.test.ts`

Run with:
```sh
VIBIUM_BIN_PATH=<path-to-vibium-binary> npx vitest run tests/repro-bug3-clock-setfixedtime.test.ts
```

Expected result: 1 pass (workaround), 1 fail (the bug case).

---

## Bug 4 — `capture.navigation()` and `page.url()` miss SPA `history.pushState()` navigation

### Summary

`page.capture.navigation()` always times out when navigation happens via `history.pushState()` (client-side SPA routing). The URL changes in the browser, but the promise never resolves. `page.url()` has the same blind spot: it returns the pre-navigation URL after a pushState change.

### Steps to reproduce

**Real-world SPA (testtrack.org / React Router):**

```ts
await page.go('https://testtrack.org');
const newUrl = await page.capture.navigation(async () => {
  await page.find({ role: 'link', text: 'Button Demo' }).click();
}, { timeout: 3000 });
// → throws: "Timeout waiting for navigation"
// but window.location.href === "https://testtrack.org/button-demo"
```

**Controlled direct reproduction:**

```ts
await page.go('https://the-internet.herokuapp.com');
const newUrl = await page.capture.navigation(async () => {
  await page.evaluate<void>('history.pushState({}, "", "/simulated-spa-route")');
}, { timeout: 2000 });
// → throws: "Timeout waiting for navigation"
// but window.location.href === "https://the-internet.herokuapp.com/simulated-spa-route"
```

**`page.url()` also affected:**

```ts
await page.go('https://the-internet.herokuapp.com');
await page.evaluate<void>('history.pushState({}, "", "/new-route")');
const reported = await page.url();
const actual = await page.evaluate<string>('window.location.href');
// reported === "https://the-internet.herokuapp.com"   ← stale
// actual   === "https://the-internet.herokuapp.com/new-route"  ✓
```

### Root cause

The Go binary subscribes to `browsingContext.load` (full page loads) and `browsingContext.fragmentNavigated` (hash `#` changes). `history.pushState()` triggers neither. `navigationCallbacks` are never called so `capture.navigation()` times out.

`page.url()` reads `session.lastURL`, which is also only updated from those two events, so it goes stale after a pushState.

Chrome 123+ added `browsingContext.historyUpdated` specifically for pushState/replaceState navigation. Adding it to the subscription list and routing it to `navigationCallbacks` would fix both issues.

### Impact

Any test against a React Router, Vue Router, Angular Router, or Next.js (client-side transition) app cannot use `capture.navigation()` to wait for route changes. Tests must fall back to fixed `page.wait(ms)` delays or poll via `waitUntil`.

### Repro file

`tests/repro-bug4-spa-navigation.test.ts`

Run with:
```sh
VIBIUM_BIN_PATH=<path-to-vibium-binary> npx vitest run tests/repro-bug4-spa-navigation.test.ts
```

Expected result: 1 pass (baseline), 2 fail (the two bug cases).

---

## Enhancement — Pierce selector support for shadow DOM

### Summary

CSS selectors passed to `page.find()` and `page.findAll()` do not cross shadow boundaries. There is no pierce combinator (`>>` or `>>>`) to query into shadow roots. All shadow DOM access must go through `page.evaluate()` with manual `element.shadowRoot` traversal, which is verbose and loses the semantic API.

### Current behaviour

```ts
// Standard CSS selector — does not pierce shadow root
const found = await page.evaluate<boolean>(
  `document.querySelector('my-paragraph p') === null`
);
// found === true — the <p> inside the shadow root is invisible to querySelector

// Only way to reach it today
const text = await page.evaluate<string>(
  `document.querySelector('my-paragraph').shadowRoot.querySelector('p').textContent.trim()`
);
// text === "My default text" ✓
```

Attempting a pierce combinator directly in `page.find()` fails:

```sh
vibium find "my-paragraph >> p"
# Error: Command failed (shell redirection interprets >> as append)

vibium find "my-paragraph >>> p"
# Error: Command failed
```

### Proposed API

Add a pierce combinator to CSS selector resolution in `page.find()` and `page.findAll()`:

```ts
// Single-level pierce — equivalent to host.shadowRoot.querySelector('p')
const p = await page.find('my-paragraph >> p');
await expect(p).toHaveText('My default text');

// Deep pierce — crosses multiple nested shadow boundaries
const btn = await page.find('outer-host >>> inner-host >> button');

// findAll with pierce
const paragraphs = await page.findAll('my-paragraph >> p');
await expect(paragraphs).toHaveCount(2);
```

This is consistent with the combinator syntax used by Playwright (`>>`) and legacy Selenium 4 (`>>>` for deep pierce).

### Why it matters

Shadow DOM is increasingly common — native browser UI components (`<input type="date">`, `<video>` controls), web component libraries (Lit, FAST, Shoelace), and design systems all use shadow roots. Without pierce support, vibium tests for these components require raw JavaScript, bypassing the semantic element API entirely and making tests harder to read and maintain.

### Repro file

`tests/repro-enhancement-shadow-pierce.test.ts`

Contains:
- Confirmed test showing CSS selectors do not pierce (passes, documents current behaviour)
- Workaround test using `shadowRoot.querySelector` via `evaluate` (passes)
- Commented-out proposed tests that should pass once the feature is implemented

---

## Environment details

| Field | Value |
|---|---|
| Package | vibium (JS client) |
| Version | 26.3.18 |
| Platform | macOS x86_64 (Darwin 25.3.0) |
| Node.js | v25.8.0 |
| Test runner | Vitest 2.1.9 |
| Vitest pool | forks |
| Chrome | managed by vibium daemon |
| Protocol | WebDriver BiDi |

## Repro repository

https://github.com/lana-20/vibium-test-js

| File | Covers |
|---|---|
| `tests/repro-bug1-waituntil-expression.test.ts` | Bug 1 — waitUntil expression timeout |
| `tests/repro-bug2-evaluate-nested-array.test.ts` | Bug 2 — nested array BiDi deserialization |
| `tests/repro-bug3-clock-setfixedtime.test.ts` | Bug 3 — clock.setFixedTime() without install |
| `tests/repro-bug4-spa-navigation.test.ts` | Bug 4 — capture.navigation() / page.url() miss pushState |
| `tests/repro-enhancement-shadow-pierce.test.ts` | Enhancement — pierce selector proposal |
| `tests/shadow-dom.test.ts` | Production shadow DOM tests (all workarounds applied) |
