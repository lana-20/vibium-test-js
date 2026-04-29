import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { BrowserContext } from 'vibium';

export async function captureRecording(context: BrowserContext, testName: string): Promise<string | null> {
  try {
    const dir = resolve(process.cwd(), 'test-results', 'recordings');
    mkdirSync(dir, { recursive: true });
    const slug = testName.replace(/[^a-z0-9]+/gi, '-').slice(0, 80);
    const filename = `${slug}-${Date.now()}.zip`;
    const filepath = resolve(dir, filename);
    const buf = await context.recording.stop();
    writeFileSync(filepath, buf);
    return filepath;
  } catch {
    return null;
  }
}
