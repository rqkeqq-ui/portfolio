// Screenshots for the case studies: cover + gallery (assets/images/projects/<slug>-*.webp) and the
// scroll-preview frames shown on project cards (assets/images/previews/<slug>-<n>.webp).
//
//   npm i --no-save playwright-core sharp     (needs a local Google Chrome)
//   npm run dev                               (in another terminal)
//   node tools/capture-projects.mjs [slug]
//
// Preview frames are separate "pages" of a site; the card scrolls through each and transitions to the next.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const site = process.env.SITE_URL ?? 'http://localhost:5173';
const app = slug => `${site}/portfolio/projects/${slug}/app/`;
const shotsDir = resolve(root, 'assets/images/projects');
const previewDir = resolve(root, 'assets/images/previews');
const PREVIEW_WIDTH = 1280;
const PREVIEW_OUT = 720;

const answerAll = async page => {
  for (let step = 0; step < 4; step++) {
    for (const group of await page.locator('.calc .opts').all()) {
      if (await group.locator('.opt.is-on').count()) continue;
      const options = group.locator('.opt');
      await options.nth((await options.count()) > 1 ? 1 : 0).click();
    }
    const next = page.locator('[data-act="next"]');
    if (!(await next.count()) || await next.isDisabled()) break;
    await next.click();
    await page.waitForTimeout(250);
  }
};
const lightZones = async page => {
  const toggles = page.locator('[data-zone-toggle]');
  for (const index of [0, 1, 2, 4]) await toggles.nth(index).click();
  await page.waitForTimeout(400);
};
const openFixflowTrack = async page => {
  const form = page.locator('main form').filter({ has: page.locator('input:visible') }).first();
  await form.locator('input:visible').nth(1).fill('4417');
  await form.locator('button[type=submit]').click();
  await page.waitForTimeout(1200);
};

// target: [url, anchor selector?, action?]; frames: [url, anchor?, height in CSS px, action?]
const projects = {
  'beauty-booking': {
    frames: [
      [`${site}/projects/beauty-booking/app/#/`, null, 2600],
      [`${site}/projects/beauty-booking/app/#/search`, null, 1900],
      [`${site}/projects/beauty-booking/app/#/booking/forma-beauty`, null, 1700],
      [`${site}/projects/beauty-booking/app/#/demo/owner`, null, 1700]
    ]
  },
  'library-system': {
    shell: true,
    frames: [['catalog', 1700], ['booking', 1300], ['mybooks', 1300], ['admin', 1700]]
  },
  northcut: {
    cover: [app('northcut')],
    gallery: [[app('northcut'), '#services'], [app('northcut'), '#masters'], [app('northcut'), '#booking']],
    frames: [[app('northcut'), null, 3000], [app('northcut'), '#masters', 2400], [app('northcut'), '#booking', 1500]]
  },
  'weekly-table': {
    cover: [app('weekly-table')],
    gallery: [[app('weekly-table'), '#menu'], [app('weekly-table'), '#control'], [app('weekly-table'), '#builder']],
    frames: [[app('weekly-table'), null, 2600], [app('weekly-table'), '#menu', 2200], [app('weekly-table'), '#control', 2000]]
  },
  'verde-office': {
    cover: [app('verde-office')],
    gallery: [[app('verde-office'), '#calc'], [app('verde-office'), '#tariffs'], [`${app('verde-office')}kp-example.html`]],
    frames: [[app('verde-office'), null, 2600], [app('verde-office'), '#calc', 2000], [`${app('verde-office')}kp-example.html`, null, 2000]]
  },
  'therma-home': {
    cover: [app('therma-home')],
    gallery: [[app('therma-home'), '#calc', answerAll], [app('therma-home'), '#price'], [app('therma-home'), '#cases']],
    frames: [[app('therma-home'), null, 2400], [app('therma-home'), '#calc', 1300, answerAll], [app('therma-home'), '#solutions', 2400]]
  },
  pawline: {
    cover: [app('pawline')],
    gallery: [[app('pawline'), '#features'], [`${app('pawline')}app/`], [app('pawline'), '#scenarios']],
    frames: [[app('pawline'), null, 2600], [`${app('pawline')}app/`, null, 1500, null, { phone: true, background: '#f1e9de' }], [app('pawline'), '#features', 2000]]
  },
  'nord-module': {
    cover: [app('nord-module')],
    gallery: [[app('nord-module'), '#configurator'], [app('nord-module'), '#size'], [app('nord-module'), '#projects']],
    frames: [[app('nord-module'), null, 2600], [app('nord-module'), '#size', 2000], [app('nord-module'), '#projects', 2200]]
  },
  'lumen-event': {
    cover: [app('lumen-event')],
    gallery: [[app('lumen-event'), '#atmosphere'], [app('lumen-event'), '#constructor', lightZones], [app('lumen-event'), '#portfolio']],
    frames: [[app('lumen-event'), null, 2600], [app('lumen-event'), '#constructor', 2200, lightZones], [app('lumen-event'), '#portfolio', 2000]]
  },
  fixflow: {
    cover: [app('fixflow')],
    gallery: [[app('fixflow'), '#process'], [`${app('fixflow')}track/?order=4902`, 'main form', openFixflowTrack], [app('fixflow'), '#cabinet']],
    frames: [[app('fixflow'), null, 2600], [`${app('fixflow')}track/?order=4902`, 'main form', 1500, openFixflowTrack], [app('fixflow'), '#cabinet', 2000]]
  }
};

async function settle(page) {
  // Walk the page once so lazy images and reveal-on-scroll sections render, then disable motion.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 450) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(110); }
  await page.waitForTimeout(500);
  await page.addStyleTag({ content: '*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; animation-duration: 1ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }' });
}

async function open(page, url, anchor, action) {
  // 'load' rather than 'networkidle': slow web-font CDNs would otherwise stall the capture.
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(900);
  await settle(page);
  if (action) await action(page);
  const top = anchor ? await page.evaluate(sel => {
    const el = document.querySelector(sel);
    const header = [...document.querySelectorAll('header, .header, .nav, .site-header')].find(h => getComputedStyle(h).position === 'fixed' || getComputedStyle(h).position === 'sticky');
    return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - (header?.offsetHeight ?? 0)) : 0;
  }, anchor) : 0;
  await page.evaluate(y => scrollTo(0, y), top);
  await page.waitForTimeout(400);
  return top;
}

async function toWebp(buffer, file, width) {
  const info = await sharp(buffer).resize({ width }).webp({ quality: 72, effort: 5 }).toFile(file);
  console.log(`  ${file.replace(root, '.')} ${info.width}×${info.height} ${Math.round(info.size / 1024)} KB`);
  return info;
}

const browser = await chromium.launch({ channel: 'chrome' });
mkdirSync(shotsDir, { recursive: true });
mkdirSync(previewDir, { recursive: true });
const manifest = {};
const only = process.argv[2];

for (const [slug, spec] of Object.entries(projects)) {
  if (only && only !== slug) continue;
  console.log(slug);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
  if (spec.cover) { await open(page, ...spec.cover); await toWebp(await page.screenshot(), resolve(shotsDir, `${slug}-cover.webp`), 1800); }
  for (const [index, target] of (spec.gallery ?? []).entries()) {
    await open(page, target[0], target[1], target[2]);
    await toWebp(await page.screenshot(), resolve(shotsDir, `${slug}-${index + 1}.webp`), 1800);
  }
  await page.close();

  const framesPage = await browser.newPage({ viewport: { width: PREVIEW_WIDTH, height: 800 } });
  manifest[slug] = [];
  for (const [index, frame] of spec.frames.entries()) {
    let buffer;
    if (spec.shell) {
      // The library demo is rendered by the portfolio itself: open its case page, switch screens via
      // the feature buttons and capture the browser frame at full height.
      const [screen, height] = frame;
      await framesPage.goto(`${site}/projects/library-system/`, { waitUntil: 'load', timeout: 90000 });
      await framesPage.locator(`[data-screen="${screen}"]`).first().click();
      await framesPage.waitForTimeout(500);
      const view = framesPage.locator('[data-demo-view]');
      await view.evaluate((el, h) => { el.style.height = `${h}px`; el.style.overflow = 'hidden'; el.scrollTop = 0; }, height);
      buffer = await view.screenshot();
    } else if (frame[4]?.phone) {
      // App prototypes are phone-sized: capture them at phone width and stand the screen in the
      // middle of a tall frame, so the card scrolls through the app like through a page.
      const [url, , height, , { background }] = frame;
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await open(phone, url);
      const shot = await phone.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(height, await phone.evaluate(() => document.documentElement.scrollHeight)) } });
      await phone.close();
      const screen = await sharp(shot).resize({ width: 380 }).toBuffer({ resolveWithObject: true });
      const radius = 36, pad = 14;
      const mask = Buffer.from(`<svg width="${screen.info.width}" height="${screen.info.height}"><rect width="100%" height="100%" rx="${radius}" ry="${radius}"/></svg>`);
      const rounded = await sharp(screen.data).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
      const bezel = Buffer.from(`<svg width="${screen.info.width + pad * 2}" height="${screen.info.height + pad * 2}"><rect width="100%" height="100%" rx="${radius + pad}" fill="#1b1b1d"/></svg>`);
      const W = PREVIEW_OUT, H = Math.max(screen.info.height + pad * 2 + 80, Math.round(W * 1.15));
      buffer = await sharp({ create: { width: W, height: H, channels: 3, background } })
        .composite([{ input: bezel, left: Math.round((W - screen.info.width) / 2 - pad), top: Math.round((H - screen.info.height) / 2 - pad) }, { input: rounded, left: Math.round((W - screen.info.width) / 2), top: Math.round((H - screen.info.height) / 2) }])
        .png().toBuffer();
    } else {
      const [url, anchor, height, action] = frame;
      const top = await open(framesPage, url, anchor, action);
      // Stitched from viewport-sized tiles: 100vh sections keep their real height, and sections that
      // reveal themselves on entering the viewport (CSS or JS) get time to appear in each tile.
      // Tiles overlap and are placed at the page's real scroll position, so seams line up exactly.
      // Only a header pinned to the top survives, and only on the first tile; bottom CTA bars and
      // sticky panels inside sections are put back into the flow.
      await framesPage.addStyleTag({ content: 'html, body { scroll-behavior: auto !important; }' });
      const pageHeight = await framesPage.evaluate(() => document.documentElement.scrollHeight);
      const frameHeight = Math.round(Math.min(height, pageHeight - top));
      const tiles = [];
      const VIEW = 800, STEP = 720;
      for (let y = 0; y < frameHeight; y += STEP) {
        await framesPage.evaluate(v => scrollTo(0, v), top + y);
        await framesPage.evaluate(first => document.querySelectorAll('body *').forEach(el => {
          const style = getComputedStyle(el);
          if (style.position !== 'fixed' && style.position !== 'sticky') return;
          const box = el.getBoundingClientRect();
          const pinnedTop = box.top <= 80;
          const headerLike = el.matches('header, nav') || (box.height < 140 && box.width >= innerWidth * 0.9);
          // Sticky panels inside sections go back into the flow; headers and bottom bars are hidden.
          if (style.position === 'sticky' && !headerLike) el.style.setProperty('position', 'relative', 'important');
          else if (!first || !pinnedTop) el.style.setProperty('visibility', 'hidden', 'important');
        }), y === 0);
        await framesPage.waitForTimeout(900);
        const scrolled = Math.round(await framesPage.evaluate(() => scrollY) - top);
        const from = Math.max(0, y - scrolled);
        const to = Math.min(VIEW, frameHeight - scrolled);
        if (to <= from) break;
        const shot = await framesPage.screenshot({ clip: { x: 0, y: 0, width: PREVIEW_WIDTH, height: VIEW } });
        tiles.push({ input: await sharp(shot).extract({ left: 0, top: from, width: PREVIEW_WIDTH, height: to - from }).toBuffer(), top: scrolled + from, left: 0 });
        if (scrolled + VIEW >= frameHeight) break;
      }
      buffer = await sharp({ create: { width: PREVIEW_WIDTH, height: frameHeight, channels: 3, background: '#ffffff' } }).composite(tiles).png().toBuffer();
    }
    const info = await toWebp(buffer, resolve(previewDir, `${slug}-${index + 1}.webp`), PREVIEW_OUT);
    manifest[slug].push({ src: `/images/previews/${slug}-${index + 1}.webp`, width: info.width, height: info.height });
  }
  await framesPage.close();
}
await browser.close();

const manifestFile = resolve(root, 'assets/js/previewFrames.json');
let previous = {};
try { previous = JSON.parse((await import('node:fs')).readFileSync(manifestFile, 'utf8')); } catch { /* first run */ }
writeFileSync(manifestFile, `${JSON.stringify({ ...previous, ...manifest }, null, 2)}\n`);
console.log('manifest →', manifestFile.replace(root, '.'));
