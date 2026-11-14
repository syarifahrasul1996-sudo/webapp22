import { defineConfig } from 'vitest/config';

// Dates are parsed in local time, so pin the timezone the app is used in.
process.env.TZ = 'Asia/Kuala_Lumpur';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
