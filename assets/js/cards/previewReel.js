// Scroll-through preview inside a card's browser mock-up. Each frame is a tall capture of one page of the
// site (assets/images/previews); the reel scrolls it top to bottom, then "navigates" to the next page with
// one of three transitions, like a visitor clicking through the site.
const TRANSITIONS = ['fade', 'slide', 'wipe'];
const HOLD = 700;          // pause at the top and bottom of a page, ms
const TRANSITION = 900;    // page change, ms
const SPEED = 0.16;        // share of the screen height scrolled per second

const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function createReel(screen, frames, { onPage } = {}) {
  let images = [];
  let index = 0;
  let phase = 'idle';
  let phaseStart = 0;
  let elapsed = 0;
  let playing = false;
  let raf = 0;

  function ensureImages() {
    if (images.length) return;
    images = frames.map((frame, i) => {
      const img = document.createElement('img');
      img.className = 'pc-frame';
      img.alt = '';
      img.decoding = 'async';
      img.width = frame.width;
      img.height = frame.height;
      img.src = frame.src;
      img.style.opacity = i === 0 ? '1' : '0';
      screen.append(img);
      return img;
    });
    screen.querySelector('.pc-poster')?.remove();
  }

  const travel = img => Math.max(0, img.getBoundingClientRect().height - screen.clientHeight);
  const scrollDuration = img => (travel(img) / Math.max(1, screen.clientHeight * SPEED)) * 1000;

  function place(img, offset, extra = '') {
    img.style.transform = `translate3d(0, ${-offset}px, 0) ${extra}`;
  }

  function step(now) {
    if (!playing) return;
    const time = now - phaseStart;
    const current = images[index];
    if (phase === 'scroll') {
      const duration = scrollDuration(current);
      const progress = Math.min(1, Math.max(0, (time - HOLD) / Math.max(1, duration)));
      place(current, travel(current) * ease(progress));
      if (time >= HOLD * 2 + duration && images.length) {
        phase = images.length > 1 ? 'transition' : 'rewind';
        phaseStart = now;
      }
    } else if (phase === 'rewind') {
      // Single-page reel: glide back to the top before scrolling again.
      const progress = Math.min(1, time / TRANSITION);
      place(current, travel(current) * (1 - ease(progress)));
      if (progress >= 1) { phase = 'scroll'; phaseStart = now; }
    } else if (phase === 'transition') {
      const next = images[(index + 1) % images.length];
      const kind = TRANSITIONS[index % TRANSITIONS.length];
      const q = ease(Math.min(1, time / TRANSITION));
      const leaving = travel(current);
      if (kind === 'fade') {
        current.style.opacity = String(1 - q);
        next.style.opacity = String(q);
        place(current, leaving, `scale(${1 - 0.04 * q})`);
        place(next, 0, `scale(${1.04 - 0.04 * q})`);
      } else if (kind === 'slide') {
        current.style.opacity = String(1 - 0.6 * q);
        next.style.opacity = '1';
        place(current, leaving, `translateX(${-28 * q}%)`);
        place(next, 0, `translateX(${100 - 100 * q}%)`);
      } else {
        next.style.opacity = '1';
        next.style.clipPath = `inset(${100 - 100 * q}% 0 0 0)`;
        place(next, 0, `translateY(${12 * (1 - q)}%)`);
      }
      next.style.zIndex = '2';
      current.style.zIndex = '1';
      if (q >= 1) {
        current.style.opacity = '0';
        current.style.clipPath = next.style.clipPath = '';
        place(current, 0);
        index = (index + 1) % images.length;
        onPage?.(index);
        phase = 'scroll';
        phaseStart = now;
      }
    }
    raf = requestAnimationFrame(step);
  }

  return {
    play() {
      if (playing || !frames.length) return;
      ensureImages();
      playing = true;
      const resume = () => {
        if (!playing) return;
        const now = performance.now();
        if (phase === 'idle') { phase = 'scroll'; phaseStart = now; } else phaseStart = now - elapsed;
        raf = requestAnimationFrame(step);
      };
      const first = images[index];
      if (first.complete) resume(); else first.addEventListener('load', resume, { once: true });
    },
    pause() {
      if (!playing) return;
      playing = false;
      elapsed = performance.now() - phaseStart;
      cancelAnimationFrame(raf);
    },
    get playing() { return playing; }
  };
}
