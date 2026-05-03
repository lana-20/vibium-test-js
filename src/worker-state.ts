import { browser, Browser } from 'vibium';
import { loadConfig } from './config';

let _browser: Browser | null = null;

export async function initBrowser(): Promise<void> {
  if (_browser) return;
  const config = await loadConfig();
  _browser = await browser.start({ headless: config.headless ?? true });
}

export function getBrowser(): Browser {
  if (!_browser) throw new Error('Browser not initialized. initBrowser() must be called in beforeAll.');
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (!_browser) return;
  const b = _browser;
  _browser = null;
  await Promise.race([
    b.stop(),
    new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
  ]).catch(() => {});
}
