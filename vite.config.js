import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const rootDir = import.meta.dirname;

function copyStaticRuntimeAssets() {
  return {
    name: 'copy-static-runtime-assets',
    closeBundle() {
      const outDir = resolve(rootDir, 'dist');
      const sourceImages = resolve(rootDir, 'assets/images');
      const targetImages = resolve(outDir, 'assets/images');

      if (existsSync(sourceImages)) {
        mkdirSync(resolve(outDir, 'assets'), { recursive: true });
        cpSync(sourceImages, targetImages, { recursive: true, force: true });
      }

      const noJekyll = resolve(rootDir, '.nojekyll');
      if (existsSync(noJekyll)) copyFileSync(noJekyll, resolve(outDir, '.nojekyll'));
    }
  };
}

// GitHub Pages serves the site under /portfolio/; the exported Next.js demos link with that
// prefix, so dev and preview map /portfolio/* back onto the root. Directory URLs of the
// static demos in public/ resolve to their index.html, as they do on Pages.
function pagesBasePath() {
  const strip = (req, _res, next) => {
    if (req.url === '/portfolio' || req.url.startsWith('/portfolio/')) req.url = req.url.slice('/portfolio'.length) || '/';
    const [path, query = ''] = req.url.split('?');
    const file = decodeURIComponent(path);
    if (file.startsWith('/projects/') && file.endsWith('/') && existsSync(resolve(rootDir, 'public', `.${file}`, 'index.html'))) {
      req.url = `${path}index.html${query ? `?${query}` : ''}`;
    }
    next();
  };
  return {
    name: 'pages-base-path',
    configureServer(server) { server.middlewares.use(strip); },
    configurePreviewServer(server) { server.middlewares.use(strip); }
  };
}

// Every projects/<slug>/index.html is a case-study page.
const projectPages = Object.fromEntries(readdirSync(resolve(rootDir, 'projects'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(resolve(rootDir, 'projects', entry.name, 'index.html')))
  .map(entry => [`project-${entry.name}`, resolve(rootDir, 'projects', entry.name, 'index.html')]));

export default defineConfig({
  base: './',
  input: {
    home: resolve(rootDir, 'index.html'),
    notFound: resolve(rootDir, '404.html'),
    projects: resolve(rootDir, 'projects/index.html'),
    ...projectPages,
    beautyBookApp: resolve(rootDir, 'projects/beauty-booking/app/index.html')
  },
  plugins: [pagesBasePath(), copyStaticRuntimeAssets()]
});
