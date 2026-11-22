const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.cjs',
  timeout: 180000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node node_modules/http-server/bin/http-server . -a 127.0.0.1 -p 4173 -c-1 --silent',
    url: 'http://127.0.0.1:4173/tests/',
    reuseExistingServer: false,
  },
});
