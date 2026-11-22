const { test, expect } = require('@playwright/test');

test('existing browser behavior suite', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  // The suite uses local media and simulated YouTube APIs, never external services.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  await page.goto('/tests/');
  await page.getByRole('button', { name: 'Run tests', exact: true }).click();
  try {
    await page.locator('#summary[data-failed]').waitFor({ timeout: 150000 });
    const results = await page.locator('#results li').allTextContents();
    console.log(results.join('\n'));
    // Catch an empty or accidentally truncated run as well as individual failures.
    expect(results.length).toBeGreaterThanOrEqual(49);
    expect(results.filter(row => !row.startsWith('OK · '))).toEqual([]);
    await expect(page.locator('#summary')).toHaveAttribute('data-failed', '0');
    expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach('browser-results', {
      body: await page.locator('main').innerText(),
      contentType: 'text/plain',
    });
  }
});
