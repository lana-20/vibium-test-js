---
name: vibium-js-api-test
description: Run the Vibium JS API coverage test suite category by category. Tests all methods across Page, Element, Browser, BrowserContext, Keyboard, Mouse, Touch, Clock, and Recording APIs using the vibium-test-js framework. Labels PASS/FAIL/BUG/SKIP per test.
---

# Vibium JS API Coverage Test Suite

Tests all public methods in the vibium JS language bindings. Each category maps to one test file. Run one category or all in sequence.

## Project directory

All commands run from:
```sh
cd /Users/lanabegunova/vibium-test-js
```

## Categories

| Arg | File | Methods covered |
|---|---|---|
| `navigation` | api-navigation.test.ts | go, back, forward, reload, url, title, content |
| `find` | api-find.test.ts | find (CSS/role/text/label/placeholder/alt/title/testid/xpath), findAll, element.find, element.findAll, fluent chaining |
| `element-actions` | api-element-actions.test.ts | click, dblclick, fill, type, clear, press, check, uncheck, selectOption, hover, focus, scrollIntoView, dispatchEvent, tap, dragTo, setFiles, element.waitUntil |
| `element-read` | api-element-read.test.ts | text, innerText, html, value, attr, getAttribute, bounds, boundingBox, isVisible, isHidden, isEnabled, isChecked, isEditable, role, label, element.screenshot |
| `wait` | api-wait.test.ts | waitUntil.url, waitUntil.loaded, wait, waitUntil(expression) — Bug 1 fixed v26.5.31 |
| `evaluate` | api-evaluate.test.ts | evaluate (string/number/boolean/object/flat array/nested array) — Bug 2 still skipped |
| `network` | api-network.test.ts | capture.response, capture.request, onRequest, onResponse, route.fulfill, route.continue, unroute, setHeaders |
| `events` | api-events.test.ts | onDialog (alert/confirm/prompt), capture.dialog, capture.navigation, onConsole/consoleMessages, onError/errors, removeAllListeners |
| `page-control` | api-page-control.test.ts | screenshot, pdf, scroll, setContent, addScript, addStyle, expose, setViewport, viewport, window, emulateMedia, a11yTree, frames, frame, bringToFront |
| `browser-context` | api-browser-context.test.ts | context.cookies, setCookies, clearCookies, storage, setStorage, clearStorage, addInitScript, browser.newPage, browser.newContext, browser.pages |
| `input` | api-input.test.ts | keyboard.press/type/down/up, mouse.click/move/down/up/wheel, touch.tap, clock.install/fastForward/runFor/setFixedTime/setSystemTime/pauseAt/resume/setTimezone |
| `recording` | api-recording.test.ts | recording.start/stop, startChunk/stopChunk, startGroup/stopGroup |

## Running

Set the binary path before running (required — no local Go binary in this repo):
```sh
export VIBIUM_BIN_PATH=/usr/local/lib/node_modules/vibium/node_modules/@vibium/darwin-x64/bin/vibium
```

**One category** — replace `<category>` with any arg from the table:
```sh
npx vitest run tests/api-<category>.test.ts
```

**All categories in sequence:**
```sh
export VIBIUM_BIN_PATH=/usr/local/lib/node_modules/vibium/node_modules/@vibium/darwin-x64/bin/vibium && for f in api-navigation api-find api-element-actions api-element-read api-wait api-evaluate api-network api-events api-page-control api-browser-context api-input api-recording; do
  echo "=== $f ===" && npx vitest run tests/$f.test.ts --reporter=verbose 2>&1
done
```

## Reporting

Parse Vitest output for each test file. Produce a result line per test:

- `PASS [method]` — test passed
- `FAIL [method]` — test failed (include first error line)
- `BUG [method]` — test was skipped due to a known bug (see below)
- `SKIP [method]` — test was skipped for another reason

After all categories, print a summary table:

```
Category           Total  Pass  Fail  Bug   Skip
navigation         7      7     0     0     0
find               13     13    0     0     0
element-actions    17     17    0     0     0
element-read       19     19    0     0     0
wait               5      3     0     2     0
evaluate           7      6     0     1     0
network            8      8     0     0     0
events             8      8     0     0     0
page-control       16     16    0     0     0
browser-context    10     10    0     0     0
input              15     15    0     0     0
recording          3      3     0     0     0
─────────────────────────────────────────────
TOTAL              128    127   0     1     0
```

**v26.5.31 baseline: 127 PASS / 1 BUG / 0 FAIL** (was 125/3/0 on v26.3.18 — Bug 1 fixed).

## Known bugs

Skipped tests marked with `test.skip` in these files are bug confirmations, not missing coverage:

| File | Skipped test name | Bug |
|---|---|---|
| api-evaluate.test.ts | `bug2: evaluate nested string[][] …` | Bug 2 — VibiumDev/vibium#124 — still broken in v26.5.31 |

Report these as `BUG` not `SKIP`.

**Bug 1 fixed in v26.5.31 (#163):** `waitUntil(expression)` bare expressions now accepted. Tests un-skipped and renamed to `bug1 FIXED (#123/#163): …` — both now PASS.

## Notes

- `VIBIUM_BIN_PATH` must be set before running — without it every suite fails immediately with "Could not find vibium binary". The path above points to the global `vibium` package install; verify it exists with `ls $VIBIUM_BIN_PATH` before running.
- `pdf` requires headless mode (default config). Mark SKIP if headless is false.
- `expose` function syntax: pass a named function string, e.g. `'function(a, b) { return a + b; }'`.
- `clock.*` tests use testtrack.org as a neutral host — no page-specific timers assumed.
- `dragTo` targets the-internet.herokuapp.com/drag_and_drop columns A and B.
- `setFiles` uses `/etc/hosts` as a readily-available local file path.
- `api-network.test.ts`: an unhandled rejection `timeout: session closed` fires in teardown after all tests pass. This is a race in the vibium BiDi layer — report the tests as PASS, not FAIL.

## Input

If the user passes a category name as the argument, run only that category.
If no argument, run all 12 categories in order and produce the full summary table.
