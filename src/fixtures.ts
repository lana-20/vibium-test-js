import type { Browser, BrowserContext, Page } from 'vibium';
import { getBrowser } from './worker-state';
import { loadConfig } from './config';

export interface TestFixtures {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function createFixtures(): Promise<TestFixtures> {
  const config = await loadConfig();
  const browser = getBrowser();
  const context = await browser.newContext();

  if (config.storageState) {
    await context.setStorage(config.storageState);
  }

  const page = await context.newPage();

  if (config.baseURL) {
    await page.go(config.baseURL);
  }

  return { browser, context, page };
}

export async function teardownFixtures(fixtures: TestFixtures): Promise<void> {
  await fixtures.context.close();
}
