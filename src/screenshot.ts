import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { Page } from 'vibium';

export async function captureFailure(page: Page, testName: string): Promise<string | null> {
  try {
    const dir = resolve(process.cwd(), 'test-results', 'failures');
    mkdirSync(dir, { recursive: true });
    const slug = testName.replace(/[^a-z0-9]+/gi, '-').slice(0, 80);
    const filename = `${slug}-${Date.now()}.png`;
    const filepath = resolve(dir, filename);
    const buf = await page.screenshot({ fullPage: false });
    writeFileSync(filepath, buf);
    return filepath;
  } catch {
    return null;
  }
}
