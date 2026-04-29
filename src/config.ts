import type { StorageState } from 'vibium';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

export interface VibiumTestConfig {
  baseURL?: string;
  headless?: boolean;
  timeout?: number;
  /** Max test-level retries for hard failures only (BrowserCrashedError, ConnectionError). Max 2. */
  retries?: number;
  screenshotOnFailure?: boolean;
  recordOnFailure?: boolean;
  storageState?: StorageState;
}

const defaults: Required<Omit<VibiumTestConfig, 'baseURL' | 'storageState'>> = {
  headless: true,
  timeout: 30_000,
  retries: 1,
  screenshotOnFailure: true,
  recordOnFailure: false,
};

export function defineConfig(config: VibiumTestConfig): VibiumTestConfig {
  return config;
}

let _resolved: VibiumTestConfig | null = null;

export async function loadConfig(): Promise<VibiumTestConfig> {
  if (_resolved) return _resolved;

  const candidates = [
    'vibium.config.ts',
    'vibium.config.mts',
    'vibium.config.js',
    'vibium.config.mjs',
  ];

  for (const name of candidates) {
    const abs = resolve(process.cwd(), name);
    if (existsSync(abs)) {
      const url = pathToFileURL(abs).href;
      const mod = await import(url);
      const raw: VibiumTestConfig = mod.default ?? mod;
      _resolved = { ...defaults, ...raw };
      return _resolved;
    }
  }

  _resolved = { ...defaults };
  return _resolved;
}

export function resetConfig(): void {
  _resolved = null;
}
