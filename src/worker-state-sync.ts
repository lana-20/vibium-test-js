import { browser, BrowserSync } from 'vibium/sync';
import { loadConfig } from './config';

let _browser: BrowserSync | null = null;

export async function initBrowserSync(): Promise<void> {
  if (_browser) return;
  const config = await loadConfig();
  _browser = browser.start({ headless: config.headless ?? true });
}

export function getBrowserSync(): BrowserSync {
  if (!_browser) throw new Error('BrowserSync not initialized. initBrowserSync() must be called in beforeAll.');
  return _browser;
}

export async function closeBrowserSync(): Promise<void> {
  if (!_browser) return;
  _browser.stop();
  _browser = null;
}
