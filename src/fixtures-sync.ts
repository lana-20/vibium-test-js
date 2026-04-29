import type { BrowserSync, BrowserContextSync, PageSync } from 'vibium/sync';
import { getBrowserSync } from './worker-state-sync';
import { loadConfig } from './config';

export interface SyncTestFixtures {
  browser: BrowserSync;
  context: BrowserContextSync;
  page: PageSync;
}

let _cachedConfig: { storageState?: unknown; baseURL?: string } | null = null;

export async function warmSyncConfig(): Promise<void> {
  _cachedConfig = await loadConfig();
}

export function createSyncFixtures(): SyncTestFixtures {
  const browser = getBrowserSync();
  const context = browser.newContext();

  if (_cachedConfig?.storageState) {
    context.setStorage(_cachedConfig.storageState as Parameters<typeof context.setStorage>[0]);
  }

  const page = context.newPage();

  if (_cachedConfig?.baseURL) {
    page.go(_cachedConfig.baseURL);
  }

  return { browser, context, page };
}

export function teardownSyncFixtures(fixtures: SyncTestFixtures): void {
  fixtures.context.close();
}
