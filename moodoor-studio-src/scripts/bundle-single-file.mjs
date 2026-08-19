/**
 * Builds a single self-contained HTML file — no npm, no server, no build step
 * for whoever runs it. JS, CSS and the whole floral canon are inlined, so the
 * page works by double-clicking it straight off the filesystem.
 *
 *   npm run build:single   →   dist/moodoor-studio.html
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const assets = readdirSync(join(DIST, 'assets'));
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('Run `vite build` first — no assets found.');

const js = readFileSync(join(DIST, 'assets', jsFile), 'utf8');
const css = readFileSync(join(DIST, 'assets', cssFile), 'utf8');
const inventory = readFileSync('public/moodoor-inventory.json', 'utf8');
const favicon = readFileSync('public/favicon.svg', 'utf8');

let html = readFileSync(join(DIST, 'index.html'), 'utf8');

// Swap the built asset tags for inline equivalents.
html = html
  .replace(new RegExp(`\\s*<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`), '')
  .replace(new RegExp(`\\s*<link[^>]*href="[^"]*${cssFile}"[^>]*>`), '')
  .replace(
    /\s*<link rel="icon"[^>]*>/,
    () =>
      `\n    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}" />`,
  );

// `</script>` anywhere inside a script body would close it early.
const guard = (s) => s.replace(/<\/script>/gi, '<\\/script>');

/**
 * Insert file content without letting `String.replace` interpret it.
 *
 * A string replacement treats `$&`, `` $` ``, `$'` and `$1` as substitution
 * patterns, so any of those appearing *inside the bundled JS* get rewritten
 * with pieces of the surrounding HTML. The engine's own regex-escape helper
 * contains `'\\$&'`, which silently became `'\\</body>'` and left a bundle
 * that parsed on a server (which serves the real asset) but threw
 * `Unexpected token '<'` from the filesystem. A function replacer is inserted
 * verbatim — never use the string form for generated content.
 */
const insert = (haystack, needle, replacement) => haystack.replace(needle, () => replacement);

html = insert(html, '</head>', `  <style>${css}</style>\n  </head>`);

html = insert(
  html,
  '</body>',
  `  <script type="application/json" id="inventory-data">${guard(inventory)}</script>
    <script type="module">${guard(js)}</script>
  </body>`,
);

const out = join(DIST, 'moodoor-studio.html');
writeFileSync(out, html);
console.log(`${out} — ${(html.length / 1024).toFixed(0)} KB, self-contained`);
