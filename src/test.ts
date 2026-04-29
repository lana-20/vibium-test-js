import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { BrowserCrashedError, ConnectionError } from 'vibium';
import { loadConfig } from './config';
import { createFixtures, teardownFixtures, type TestFixtures } from './fixtures';
import { createSyncFixtures, teardownSyncFixtures, warmSyncConfig, type SyncTestFixtures } from './fixtures-sync';
import { initBrowser, closeBrowser } from './worker-state';
import { initBrowserSync, closeBrowserSync } from './worker-state-sync';
import { captureFailure } from './screenshot';
import { captureRecording } from './recording-capture';
import { registerWorkerHooks } from './runner-adapter';

type AsyncTestFn = (fixtures: TestFixtures) => Promise<void>;
type SyncTestFn = (fixtures: SyncTestFixtures) => void;

type TestApi = {
  (name: string, fn: AsyncTestFn): void;
  only: (name: string, fn: AsyncTestFn) => void;
  skip: (name: string, fn: AsyncTestFn) => void;
  sync: SyncTestApi;
};

type SyncTestApi = {
  (name: string, fn: SyncTestFn): void;
  only: (name: string, fn: SyncTestFn) => void;
  skip: (name: string, fn: SyncTestFn) => void;
};

function isHardFailure(err: unknown): boolean {
  return err instanceof BrowserCrashedError || err instanceof ConnectionError;
}

function getTestRunner(): {
  test: (name: string, fn: () => Promise<void>) => void;
  testOnly: (name: string, fn: () => Promise<void>) => void;
  testSkip: (name: string, fn: () => Promise<void>) => void;
} {
  const g = globalThis as Record<string, unknown>;
  const t = (g.test ?? g.it) as ((name: string, fn: () => Promise<void>) => void) | undefined;
  if (!t) throw new Error('vibium-test-js: no test/it global found. Is a supported runner loaded?');
  return {
    test: t,
    testOnly: (t as unknown as { only: typeof t }).only ?? t,
    testSkip: (t as unknown as { skip: typeof t }).skip ?? (() => {}),
  };
}

let asyncHooksRegistered = false;
let syncHooksRegistered = false;

function ensureAsyncHooks(): void {
  if (asyncHooksRegistered) return;
  asyncHooksRegistered = true;
  registerWorkerHooks(initBrowser, closeBrowser);
}

function ensureSyncHooks(): void {
  if (syncHooksRegistered) return;
  syncHooksRegistered = true;
  registerWorkerHooks(async () => {
    await warmSyncConfig();
    await initBrowserSync();
  }, closeBrowserSync);
}

async function runAsync(name: string, fn: AsyncTestFn, retries: number): Promise<void> {
  const config = await loadConfig();
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const fixtures = await createFixtures();
    try {
      if (config.recordOnFailure) {
        await fixtures.context.recording.start({ title: name });
      }
      await fn(fixtures);
      if (config.recordOnFailure) {
        // Test passed — discard recording without saving
        await fixtures.context.recording.stop().catch(() => {});
      }
      await teardownFixtures(fixtures);
      return;
    } catch (err) {
      if (config.screenshotOnFailure) {
        await captureFailure(fixtures.page, name).catch(() => {});
      }
      if (config.recordOnFailure) {
        await captureRecording(fixtures.context, name).catch(() => {});
      }
      await teardownFixtures(fixtures).catch(() => {});

      lastErr = err;
      if (!isHardFailure(err) || attempt >= retries) break;
    }
  }

  throw lastErr;
}

function runSync(name: string, fn: SyncTestFn, retries: number): void {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const fixtures = createSyncFixtures();
    try {
      fn(fixtures);
      teardownSyncFixtures(fixtures);
      return;
    } catch (err) {
      try {
        const dir = resolve(process.cwd(), 'test-results', 'failures');
        mkdirSync(dir, { recursive: true });
        const slug = name.replace(/[^a-z0-9]+/gi, '-').slice(0, 80);
        const buf = fixtures.page.screenshot();
        writeFileSync(resolve(dir, `${slug}-${Date.now()}.png`), buf);
      } catch { /* ignore capture errors */ }
      teardownSyncFixtures(fixtures);

      lastErr = err;
      if (!isHardFailure(err) || attempt >= retries) break;
    }
  }

  throw lastErr;
}

function buildAsyncTest(runnerFn: (name: string, fn: () => Promise<void>) => void) {
  return (name: string, fn: AsyncTestFn): void => {
    ensureAsyncHooks();
    runnerFn(name, async () => {
      const config = await loadConfig();
      const retries = Math.min(config.retries ?? 1, 2);
      await runAsync(name, fn, retries);
    });
  };
}

function buildSyncTest(runnerFn: (name: string, fn: () => Promise<void>) => void) {
  return (name: string, fn: SyncTestFn): void => {
    ensureSyncHooks();
    runnerFn(name, async () => {
      const config = await loadConfig();
      const retries = Math.min(config.retries ?? 1, 2);
      runSync(name, fn, retries);
    });
  };
}

export const test: TestApi = (() => {
  const runner = getTestRunner();

  const t = buildAsyncTest(runner.test) as TestApi;
  t.only = buildAsyncTest(runner.testOnly);
  t.skip = buildAsyncTest(runner.testSkip);

  const s = buildSyncTest(runner.test) as SyncTestApi;
  s.only = buildSyncTest(runner.testOnly);
  s.skip = buildSyncTest(runner.testSkip);
  t.sync = s;

  return t;
})();
