import { cpSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
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

export default defineConfig({
  base: './',
  input: {
    home: resolve(rootDir, 'index.html'),
    notFound: resolve(rootDir, '404.html'),
    projects: resolve(rootDir, 'projects/index.html'),
    beautyBooking: resolve(rootDir, 'projects/beauty-booking/index.html'),
    librarySystem: resolve(rootDir, 'projects/library-system/index.html')
  },
  plugins: [copyStaticRuntimeAssets()]
});
