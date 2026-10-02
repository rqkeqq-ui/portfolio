// Minimal in-page router for the clickable project demos: history, address bar and event delegation.
export const escape = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

export function createDemoShell(frame, demo) {
  const view = frame.querySelector('[data-demo-view]');
  const urlText = frame.querySelector('[data-demo-url]');
  const backButton = frame.querySelector('[data-demo-back]');
  const forwardButton = frame.querySelector('[data-demo-forward]');
  const listeners = new Set();
  let state = demo.initialState();
  let stack = [demo.start];
  let position = 0;

  const route = () => stack[position];
  const ctx = {
    get state() { return state; },
    go,
    rerender: () => render(false)
  };

  function render(resetScroll) {
    const active = document.activeElement;
    const keep = active && view.contains(active) && active.dataset.input
      ? { key: active.dataset.input, start: active.selectionStart, end: active.selectionEnd }
      : null;
    const scroll = view.scrollTop;
    view.innerHTML = demo.render(route(), state);
    view.scrollTop = resetScroll ? 0 : scroll;
    if (keep) {
      const input = view.querySelector(`[data-input="${keep.key}"]`);
      if (input) {
        input.focus({ preventScroll: true });
        try { input.setSelectionRange(keep.start, keep.end); } catch { /* selects and number inputs have no selection */ }
      }
    }
    urlText.textContent = demo.host + demo.path(route());
    backButton.disabled = position === 0;
    forwardButton.disabled = position >= stack.length - 1;
    listeners.forEach(listener => listener(route()));
  }

  function go(name, params = {}) {
    stack = stack.slice(0, position + 1);
    stack.push({ name, params });
    position = stack.length - 1;
    render(true);
  }

  view.addEventListener('click', event => {
    const link = event.target.closest('[data-go]');
    if (link && view.contains(link)) {
      event.preventDefault();
      const { go: name, ...params } = link.dataset;
      go(name, params);
      return;
    }
    const action = event.target.closest('[data-act]');
    if (action && view.contains(action) && !action.disabled) {
      event.preventDefault();
      demo.action(action.dataset.act, action, ctx);
    }
  });
  view.addEventListener('input', event => {
    const field = event.target.closest('[data-input]');
    if (field) demo.input?.(field.dataset.input, field, ctx);
  });
  view.addEventListener('submit', event => event.preventDefault());
  backButton.addEventListener('click', () => { if (position > 0) { position--; render(true); } });
  forwardButton.addEventListener('click', () => { if (position < stack.length - 1) { position++; render(true); } });

  render(true);

  return {
    go,
    route,
    reset() { state = demo.initialState(); stack = [demo.start]; position = 0; render(true); },
    onRoute(listener) { listeners.add(listener); listener(route()); }
  };
}
