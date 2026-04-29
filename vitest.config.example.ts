import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['vibium-test-js/vitest.setup'],
    testTimeout: 60_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        // one browser per worker; adjust to CPU count
        maxForks: 4,
      },
    },
  },
});
