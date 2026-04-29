type HookFn = () => void | Promise<void>;

interface RunnerHooks {
  beforeAll: (fn: HookFn) => void;
  afterAll: (fn: HookFn) => void;
  beforeEach: (fn: HookFn) => void;
  afterEach: (fn: HookFn) => void;
}

function detectRunner(): 'vitest' | 'jest' | 'unknown' {
  if (process.env.VITEST) return 'vitest';
  if (process.env.JEST_WORKER_ID) return 'jest';
  return 'unknown';
}

export function getHooks(): RunnerHooks {
  const runner = detectRunner();

  if (runner === 'vitest' || runner === 'jest') {
    // Both Vitest and Jest expose these as globals in the test environment
    return {
      beforeAll: (globalThis as Record<string, unknown>).beforeAll as RunnerHooks['beforeAll'],
      afterAll: (globalThis as Record<string, unknown>).afterAll as RunnerHooks['afterAll'],
      beforeEach: (globalThis as Record<string, unknown>).beforeEach as RunnerHooks['beforeEach'],
      afterEach: (globalThis as Record<string, unknown>).afterEach as RunnerHooks['afterEach'],
    };
  }

  throw new Error(
    'vibium-test-js: Could not detect Vitest or Jest. ' +
    'Make sure the setup file is loaded via setupFiles in your runner config.'
  );
}

export function registerWorkerHooks(
  onSetup: () => Promise<void>,
  onTeardown: () => Promise<void>
): void {
  const hooks = getHooks();
  hooks.beforeAll(onSetup);
  hooks.afterAll(onTeardown);
}
