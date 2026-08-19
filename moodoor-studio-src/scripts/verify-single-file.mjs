/**
 * Opens `dist/moodoor-studio.html` the way the operator does — straight off the
 * filesystem — and fails the build if it doesn't mount.
 *
 * This exists because of a shipped blank screen. Every check up to that point
 * ran against `vite preview`, which serves the *real* asset files; the
 * single-file bundle is a separate artifact built by a separate script, and a
 * bug in that script corrupted the JS. The served build was fine and the
 * downloaded file was broken, so a green test suite meant nothing.
 *
 * The rule this encodes: verify the artifact you hand over, over the protocol
 * it will be opened with.
 *
 *   npm run verify:single
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve('dist/moodoor-studio.html');
if (!existsSync(FILE)) {
  console.error('No dist/moodoor-studio.html — run `npm run build:single` first.');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('verify:single — skipped (playwright not installed).');
  process.exit(0);
}

// Honour the environment's preinstalled browser when there is one.
const executablePath = process.env.CHROMIUM_PATH || undefined;

let browser;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
} catch (err) {
  console.log(`verify:single — skipped (no browser available: ${err.message.split('\n')[0]}).`);
  process.exit(0);
}

const page = await browser.newPage();
const failures = [];
page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));
page.on('console', (m) => {
  const text = m.text();
  // Font/CDN fetches are blocked in sandboxes and say nothing about the bundle.
  if (m.type() === 'error' && !/ERR_CERT|net::ERR_(NAME|INTERNET|CONNECTION)/.test(text)) {
    failures.push(`console error: ${text}`);
  }
});

await page.goto(`file://${FILE}`);
await page.waitForTimeout(2000);

const checks = await page.evaluate(() => ({
  mounted: (document.getElementById('root')?.innerHTML.length ?? 0) > 500,
  hasNav: !!document.querySelector('.pipenav'),
  steps: [...document.querySelectorAll('.pipestep')].map((el) => el.textContent.trim()),
  // The canon has to come off the embedded blob — `fetch` of a sibling file is
  // blocked under file://, so this is the check that path still works.
  inventory: (() => {
    try {
      const el = document.getElementById('inventory-data');
      const data = JSON.parse(el.textContent);
      return { species: data.species?.length ?? 0, skus: data.sku_count_total ?? 0 };
    } catch {
      return null;
    }
  })(),
}));

await browser.close();

if (!checks.mounted) failures.push('app did not mount — #root is empty');
if (!checks.hasNav) failures.push('pipeline nav did not render');
if (!checks.inventory?.species) failures.push('embedded inventory is missing or unparseable');

if (failures.length) {
  console.error('verify:single — FAILED from file://');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `verify:single — mounted from file://, ${checks.steps.length} pipeline steps, ` +
    `${checks.inventory.species} species / ${checks.inventory.skus} SKUs embedded.`,
);
