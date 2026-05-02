import { expect } from 'vitest';
import { test } from '../src';

const URL = 'https://testtrack.org';

test('recording.start and stop returns ZIP buffer', async ({ context, page }) => {
  await context.recording.start({ name: 'api-recording-test' });
  await page.go(URL);
  const buf = await context.recording.stop();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
  expect(buf.slice(0, 2).toString()).toBe('PK');
});

test('recording.startChunk and stopChunk returns chunk buffer', async ({ context, page }) => {
  await context.recording.start({ name: 'api-chunk-test' });
  await page.go(URL);
  await context.recording.startChunk({ name: 'chunk-1' });
  await page.find('h1').text();
  const buf = await context.recording.stopChunk();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
  await context.recording.stop().catch(() => {});
});

test('recording.startGroup and stopGroup wrap named action groups', async ({ context, page }) => {
  await context.recording.start({ name: 'api-group-test' });
  await page.go(URL);
  await context.recording.startGroup('navigation');
  await page.find('h1').text();
  await context.recording.stopGroup();
  const buf = await context.recording.stop();
  expect(buf).toBeInstanceOf(Buffer);
  expect(buf.length).toBeGreaterThan(0);
});
