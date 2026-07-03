import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/global-setup.ts',
    setupFiles: ['./tests/setup.ts'],
    // one db, so files run one at a time
    fileParallelism: false,
    testTimeout: 20000,
  },
});
