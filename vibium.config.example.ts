import { defineConfig } from './src/config';

export default defineConfig({
  baseURL: 'http://localhost:3000',
  headless: true,
  timeout: 30_000,
  retries: 1,
  screenshotOnFailure: true,
  recordOnFailure: false,
});
