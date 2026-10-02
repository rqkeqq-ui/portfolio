import { containFrameScroll } from './siteFrameDemo.js';

// Hosts a real same-origin app (e.g. BeautyBook) inside the project page's browser frame.
// The app reports its hash route via postMessage; this keeps the address bar, history buttons and role switch in sync.
export function createFrameDemo(frame, demo) {
  const view = frame.querySelector('[data-demo-view]');
  const urlText = frame.querySelector('[data-demo-url]');
  const backButton = frame.querySelector('[data-demo-back]');
  const forwardButton = frame.querySelector('[data-demo-forward]');
  const openLink = frame.querySelector('[data-demo-open]');
  const listeners = new Set();
  let stack = [];
  let position = -1;
  let travelling = false;
  let current = demo.start;

  view.classList.add('pj-browser-view-frame');
  view.removeAttribute('tabindex');
  view.innerHTML = `<iframe src="${demo.src}#${demo.start}" title="${demo.title}" loading="lazy"></iframe>`;
  const iframe = view.querySelector('iframe');
  iframe.addEventListener('load', () => { try { containFrameScroll(iframe.contentWindow); } catch { /* not same-origin */ } });

  function sync() {
    urlText.textContent = demo.host + current;
    backButton.disabled = position <= 0;
    forwardButton.disabled = position >= stack.length - 1;
    if (openLink) openLink.href = `${demo.src}#${current}`;
    listeners.forEach(listener => listener(current));
  }

  function load(path, { replace = true } = {}) {
    const target = iframe.contentWindow;
    if (!target) return;
    if (replace) target.location.replace(`${demo.src}#${path}`);
    else target.location.hash = path;
  }

  addEventListener('message', event => {
    if (event.source !== iframe.contentWindow || event.data?.type !== 'beautybook:route') return;
    const path = event.data.path;
    if (path.startsWith('/demo/')) return;
    current = path;
    if (travelling) {
      travelling = false;
    } else if (stack[position] !== path) {
      stack = stack.slice(0, position + 1);
      stack.push(path);
      position = stack.length - 1;
    }
    sync();
  });

  backButton.addEventListener('click', () => { if (position > 0) { position--; travelling = true; load(stack[position]); } });
  forwardButton.addEventListener('click', () => { if (position < stack.length - 1) { position++; travelling = true; load(stack[position]); } });
  sync();

  return {
    go(path) { load(path, { replace: false }); },
    route: () => current,
    reset() { stack = []; position = -1; load('/demo/reset'); },
    onRoute(listener) { listeners.add(listener); listener(current); }
  };
}
