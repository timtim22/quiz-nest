import { defineConfig } from 'vitest/config';
import { TEST_ENV } from './test/test-env.js';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // The test files share one database, so they take turns.
    fileParallelism: false,
    env: TEST_ENV,
  },
});
