// Copies the browser-facing files of each project into public/projects/<slug>/app/,
// where Vite serves them in dev and copies them verbatim into dist for GitHub Pages.
//
//   node tools/sync-demos.mjs              sync every static project
//   node tools/sync-demos.mjs pawline      sync one project
//
// Source folders live outside the repository; override a path with
// DEMO_SRC_<SLUG> (e.g. DEMO_SRC_PAWLINE=D:/work/PAWLINE). Next.js projects are
// exported separately by tools/export-next-demos.mjs.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const root = resolve(import.meta.dirname, '..');
const desktop = join(homedir(), 'Desktop', 'Проекты');

export const staticDemos = {
  'verde-office': join(desktop, 'Verde office'),
  'therma-home': join(desktop, 'Therma home'),
  pawline: join(desktop, 'PAWLINE'),
  'nord-module': join(desktop, 'Nord module'),
  'lumen-event': join(desktop, 'Lumen Event')
};

// Anything a visitor's browser never requests: docs, tests, tooling, servers, native apps, collected data.
const skip = new Set([
  '.git', '.claude', '.gitignore', '.dockerignore', 'node_modules', 'tests', 'tools', 'shots', 'docs',
  'android', 'data', 'server.js', 'dev-server.js', 'Dockerfile', 'docker-compose.yml'
]);
const skipFile = name => skip.has(name) || /\.md$/i.test(name);

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (skipFile(name)) continue;
    const source = join(from, name);
    const target = join(to, name);
    if (statSync(source).isDirectory()) copyTree(source, target);
    else cpSync(source, target);
  }
}

const only = process.argv[2];
for (const [slug, defaultSource] of Object.entries(staticDemos)) {
  if (only && only !== slug) continue;
  const source = process.env[`DEMO_SRC_${slug.replace(/-/g, '_').toUpperCase()}`] || defaultSource;
  if (!existsSync(join(source, 'index.html'))) {
    console.warn(`[sync-demos] skip ${slug}: no index.html in ${source}`);
    continue;
  }
  const target = join(root, 'public', 'projects', slug, 'app');
  rmSync(target, { recursive: true, force: true });
  copyTree(source, target);
  console.log(`[sync-demos] ${slug} ← ${source}`);
}
