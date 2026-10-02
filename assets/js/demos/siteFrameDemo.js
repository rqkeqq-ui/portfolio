// Hosts a finished same-origin site (public/projects/<slug>/app/) inside the project page's browser frame.
// The site knows nothing about the portfolio, so the frame watches its location instead of waiting for messages:
// load and hashchange cover static pages, a light poll catches pushState navigations of the Next.js exports.
// Every move uses location.replace, so the demo keeps its own back/forward stack and never adds entries to the
// visitor's browser history.
//
// Browsers scroll every ancestor document when a framed page jumps to an anchor, calls scrollIntoView or
// focuses a field, which would drag the portfolio page away from the frame. The framed window is therefore
// taught to scroll only itself.
// Scroll the framed window (and only it) so the element sits below the site's sticky header.
function scrollInside(win, element, smooth = true) {
  const root = win.getComputedStyle(win.document.documentElement);
  const offset = (parseFloat(root.scrollPaddingTop) || 0) + (parseFloat(win.getComputedStyle(element).scrollMarginTop) || 0);
  const top = element.getBoundingClientRect().top + win.scrollY - offset;
  win.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
}

// Safety net for whatever the framed site does on its own (location.hash, native focus, …): if the
// portfolio page moves within a second of an interaction inside the frame, without the visitor scrolling
// the page themselves, it is put back.
let guardUntil = 0;
let guardY = 0;
let userScroll = 0;
const markUser = () => { userScroll = performance.now(); };
['wheel', 'touchmove', 'keydown'].forEach(type => addEventListener(type, markUser, { passive: true }));
addEventListener('scroll', () => {
  const now = performance.now();
  if (now < guardUntil && now - userScroll > 400 && Math.abs(scrollY - guardY) > 2) scrollTo({ top: guardY, behavior: 'instant' });
}, { passive: true });
function armGuard() { guardY = scrollY; guardUntil = performance.now() + 1200; }

// scrollIntoView and focus inside the frame stop scrolling the portfolio page around it.
export function containFrameScroll(win) {
  if (win.__rqkeContained) return;
  win.__rqkeContained = true;
  win.document.addEventListener('pointerdown', armGuard, true);
  win.document.addEventListener('keydown', armGuard, true);
  win.Element.prototype.scrollIntoView = function scrollIntoViewInFrame(options) {
    scrollInside(win, this, !(options && typeof options === 'object' && options.behavior === 'instant'));
  };
  const focus = win.HTMLElement.prototype.focus;
  win.HTMLElement.prototype.focus = function focusInFrame(options) {
    focus.call(this, { ...(options || {}), preventScroll: true });
    if (options && options.preventScroll) return;
    const box = this.getBoundingClientRect();
    if (box.top < 0 || box.bottom > win.innerHeight) scrollInside(win, this);
  };
}

export function createSiteFrameDemo(frame, demo) {
  const view = frame.querySelector('[data-demo-view]');
  const urlText = frame.querySelector('[data-demo-url]');
  const backButton = frame.querySelector('[data-demo-back]');
  const forwardButton = frame.querySelector('[data-demo-forward]');
  const openLink = frame.querySelector('[data-demo-open]');
  const listeners = new Set();
  const base = new URL(demo.src, location.href);
  let stack = [demo.start];
  let position = 0;
  let current = demo.start;
  let travelling = false;
  let pendingHash = '';

  view.classList.add('pj-browser-view-frame');
  view.removeAttribute('tabindex');
  view.innerHTML = `<iframe src="${base.href}${demo.start}" title="${demo.title}" loading="lazy"></iframe>`;
  const iframe = view.querySelector('iframe');

  function sync() {
    urlText.textContent = demo.host + current;
    backButton.disabled = position <= 0;
    forwardButton.disabled = position >= stack.length - 1;
    if (openLink) openLink.href = base.href + current;
    listeners.forEach(listener => listener(current));
  }

  const frameWindow = () => { try { return iframe.contentWindow?.document ? iframe.contentWindow : null; } catch { return null; } };

  // Path of the framed page relative to the demo root, e.g. "track/?order=4902" or "#calc".
  function readLocation() {
    const win = frameWindow();
    if (!win || !win.location.href.startsWith(base.href)) return null;
    return win.location.href.slice(base.href.length).replace(/^index\.html/, '');
  }

  function observe() {
    const path = readLocation();
    if (path === null || path === current) return;
    current = path;
    if (travelling) travelling = false;
    else if (stack[position] !== path) {
      stack = stack.slice(0, position + 1);
      stack.push(path);
      position = stack.length - 1;
    }
    sync();
  }

  const split = path => { const at = path.indexOf('#'); return at < 0 ? [path, ''] : [path.slice(0, at), path.slice(at)]; };

  function jumpToHash(win, hash, smooth = true) {
    const id = decodeURIComponent(hash.slice(1));
    const target = id ? win.document.getElementById(id) || win.document.getElementsByName(id)[0] : null;
    if (target) scrollInside(win, target, smooth);
    else if (!id) win.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    if (win.location.hash !== hash) win.history.replaceState(win.history.state, '', hash || win.location.pathname + win.location.search);
    observe();
  }

  function contain(win) {
    if (win.__rqkeContained) return;
    containFrameScroll(win);
    // Same-page anchors: capture before the site's own handlers (Next.js Link included).
    win.document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href*="#"]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank') return;
      const url = new URL(link.href, win.location.href);
      if (url.origin !== win.location.origin || url.pathname !== win.location.pathname || url.search !== win.location.search || !url.hash) return;
      // Only the browser's own jump is cancelled: the site still gets the click (to close its mobile
      // menu and unlock scrolling), and the in-frame scroll runs once it has done so.
      event.preventDefault();
      setTimeout(() => jumpToHash(win, url.hash), 60);
    }, true);
  }

  function load(path) {
    const win = frameWindow();
    const [page, hash] = split(path);
    const [currentPage] = split(current);
    if (win && page === currentPage) { jumpToHash(win, hash); return; }
    pendingHash = hash;
    try { win.location.replace(base.href + page); }
    catch { iframe.src = base.href + page; }
  }

  iframe.addEventListener('load', () => {
    const win = frameWindow();
    if (win) {
      contain(win);
      win.addEventListener('hashchange', observe);
      if (pendingHash) { const hash = pendingHash; pendingHash = ''; setTimeout(() => jumpToHash(win, hash, false), 120); }
    }
    observe();
  });
  const poll = setInterval(() => {
    if (document.hidden) return;
    const win = frameWindow();
    if (win && !win.__rqkeContained && win.document.readyState !== 'loading') contain(win);
    observe();
  }, 400);
  addEventListener('pagehide', () => clearInterval(poll), { once: true });

  backButton.addEventListener('click', () => { if (position > 0) { position--; travelling = true; load(stack[position]); } });
  forwardButton.addEventListener('click', () => { if (position < stack.length - 1) { position++; travelling = true; load(stack[position]); } });
  sync();

  return {
    go(path) { load(path); },
    route: () => current,
    reset() { stack = [demo.start]; position = 0; load(demo.start); current = demo.start; sync(); },
    onRoute(listener) { listeners.add(listener); listener(current); }
  };
}
