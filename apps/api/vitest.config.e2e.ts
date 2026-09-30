import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      // The e2e tests replace PrismaService with a fake, so no database is needed.
      DATABASE_URL: 'postgresql://test:test@localhost:5432/quiz_nest_test',
    },
  },
});
