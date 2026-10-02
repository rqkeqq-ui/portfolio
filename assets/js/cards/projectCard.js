// Project card: an animated shader fills the card, a browser mock-up in the middle scrolls through the site,
// a translucent glass panel carries the text. Shared by the home page rail and the projects archive.
import { shaderField } from './shaderField.js';
import { createReel } from './previewReel.js';
import previewFrames from '../previewFrames.json';

// Effect, palette (background → highlight) and the address shown for each preview page.
const LOOKS = {
  'beauty-booking': { effect: 'mesh', palette: ['#2a1421', '#d98aa0', '#f3c9a8'], host: 'beautybook.demo/', paths: ['', 'search', 'booking/forma-beauty', 'dashboard'] },
  northcut: { effect: 'ink', palette: ['#0f0d0c', '#7a3e1d', '#d08a4f'], host: 'northcut.demo/', paths: ['', '#masters', '#booking'] },
  'weekly-table': { effect: 'lava', palette: ['#3b1d12', '#e2552d', '#f6c453'], host: 'weekly-table.demo/', paths: ['', '#menu', '#control'] },
  'verde-office': { effect: 'silk', palette: ['#0c2418', '#2f7a4f', '#b5dfa8'], host: 'verde-office.demo/', paths: ['', '#calc', 'kp-example'] },
  'therma-home': { effect: 'lava', palette: ['#121418', '#c2410c', '#fbbf24'], host: 'therma-home.demo/', paths: ['', '#calc', '#solutions'] },
  pawline: { effect: 'mesh', palette: ['#0b302a', '#25a58e', '#ffc9a3'], host: 'pawline.demo/', paths: ['', 'app', '#features'] },
  'nord-module': { effect: 'contour', palette: ['#14181c', '#3c4853', '#cf7446'], host: 'nord-module.demo/', paths: ['', '#size', '#projects'] },
  'lumen-event': { effect: 'aurora', palette: ['#09060f', '#f2b54a', '#8b5cf6'], host: 'lumen-event.demo/', paths: ['', '#constructor', '#portfolio'] },
  fixflow: { effect: 'waves', palette: ['#0b1828', '#2563b5', '#f5a623'], host: 'fixflow.demo/', paths: ['', 'track?order=4902', '#cabinet'] },
  'library-system': { effect: 'marble', palette: ['#120d26', '#5b3fd1', '#c9bcff'], host: 'library.demo/', paths: ['catalog', 'books/1984', 'my-books', 'admin'] }
};
const FALLBACK_LOOK = { effect: 'silk', palette: ['#141414', '#6d5a43', '#c2aa89'], host: 'rqke.demo/', paths: [''] };

const escape = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

export function renderProjectCard(project, { index, href, asset, label, meta, arrow, className = '' }) {
  const look = LOOKS[project.slug] || FALLBACK_LOOK;
  const frames = previewFrames[project.slug] || [];
  const poster = frames[0] ? asset(frames[0].src) : asset(project.coverImage.src);
  const [c1, c2, c3] = look.palette;
  return `<a href="${href}" class="pc-card ${className}" data-slug="${escape(project.slug)}" data-index="${index}" aria-label="${escape(label)}: ${escape(project.title)}" style="--pc-c1:${c1};--pc-c2:${c2};--pc-c3:${c3}">
    <canvas class="pc-shader" aria-hidden="true"></canvas>
    <span class="pc-topline"><span class="pc-number">${String(index + 1).padStart(2, '0')}</span><span class="pc-tags">${(project.tags || []).slice(0, 3).map(tag => `<span>${escape(tag)}</span>`).join('')}</span></span>
    <span class="pc-device" aria-hidden="true">
      <span class="pc-bar"><span class="pc-dots"><i></i><i></i><i></i></span><span class="pc-url">${escape(look.host + (look.paths[0] || ''))}</span></span>
      <span class="pc-screen"><img class="pc-poster" src="${poster}" alt="" loading="lazy" decoding="async"></span>
    </span>
    <span class="pc-glass">
      <span class="pc-meta">${escape(meta)}</span>
      <strong class="pc-title">${escape(project.title)}</strong>
      <span class="pc-subtitle">${escape(project.subtitle)}</span>
      <span class="pc-arrow" aria-hidden="true">${arrow}</span>
    </span>
  </a>`;
}

// Hover drives the preview only on wide layouts with a real mouse; phones, tablets and narrow windows
// autoplay the card closest to the centre of the screen instead.
const hoverLayout = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Wires every .pc-card inside root: shader background, preview reel, hover on desktop, autoplay on touch.
export function mountProjectCards(root, { asset }) {
  const field = shaderField();
  const cards = [...root.querySelectorAll('.pc-card')].map((card, i) => {
    const look = LOOKS[card.dataset.slug] || FALLBACK_LOOK;
    const frames = (previewFrames[card.dataset.slug] || []).map(frame => ({ ...frame, src: asset(frame.src) }));
    const url = card.querySelector('.pc-url');
    const shader = field.supported
      ? field.add(card.querySelector('.pc-shader'), { effect: look.effect, palette: look.palette, seed: i * 0.37 })
      : (card.classList.add('pc-card--static'), null);
    const reel = createReel(card.querySelector('.pc-screen'), frames, {
      onPage: page => { url.textContent = look.host + (look.paths[page] || ''); }
    });
    return { card, shader, reel };
  });

  const activate = (entry, on) => {
    entry.card.classList.toggle('is-playing', on);
    entry.shader?.setEnergy(on ? 1 : 0);
    if (reducedMotion.matches) return;
    if (on) entry.reel.play(); else entry.reel.pause();
  };

  const autoplay = () => !hoverLayout.matches || document.documentElement.classList.contains('rqke-force-mobile');
  for (const entry of cards) {
    entry.card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !autoplay()) activate(entry, true); });
    entry.card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse' && !autoplay()) activate(entry, false); });
    entry.card.addEventListener('focus', () => { if (!autoplay()) activate(entry, true); });
    entry.card.addEventListener('blur', () => { if (!autoplay()) activate(entry, false); });
  }

  // Autoplay: the card whose centre is nearest the middle of the screen plays, provided at least 55 % of it
  // is visible; works for the horizontal slider and for vertical lists alike.
  let current = null;
  let queued = false;
  const pick = () => {
    queued = false;
    if (!autoplay()) { if (current) activate(current, false); current = null; return; }
    const cx = innerWidth / 2, cy = innerHeight / 2;
    let best = null, bestDistance = Infinity;
    for (const entry of cards) {
      const box = entry.card.getBoundingClientRect();
      const visibleW = Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0));
      const visibleH = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
      if (!box.width || (visibleW * visibleH) / (box.width * box.height) < 0.55) continue;
      const distance = Math.hypot(box.left + box.width / 2 - cx, box.top + box.height / 2 - cy);
      if (distance < bestDistance) { best = entry; bestDistance = distance; }
    }
    if (best === current) return;
    if (current) activate(current, false);
    current = best;
    if (current) activate(current, true);
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  root.addEventListener('scroll', schedule, { passive: true, capture: true });
  hoverLayout.addEventListener?.('change', schedule);
  schedule();
}
