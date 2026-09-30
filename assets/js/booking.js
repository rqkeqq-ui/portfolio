// Official Cal.com queue bootstrap. The remote script is requested only on opening.
export function mountCalBooking(container, { calLink, language, title, onLoad }) {
  if (container.dataset.mounted === 'true') return;
  container.dataset.mounted = 'true';
  if (!window.Cal) {
    const enqueue = (api, args) => api.q.push(args);
    window.Cal = function (...args) {
      const cal = window.Cal;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        const script = document.createElement('script');
        script.src = 'https://app.cal.com/embed/embed.js';
        script.async = true;
        script.addEventListener('error', () => { container.dataset.mounted = 'false'; });
        document.head.append(script);
        cal.loaded = true;
      }
      if (args[0] === 'init') {
        const namespace = args[1];
        const api = function (...instruction) { enqueue(api, instruction); };
        api.q = [];
        cal.ns[namespace] = cal.ns[namespace] || api;
        enqueue(cal.ns[namespace], args);
        enqueue(cal, ['initNamespace', namespace]);
        return;
      }
      enqueue(cal, args);
    };
  }
  const namespace = 'rqke-intro';
  window.Cal('init', namespace, { origin: 'https://cal.com' });
  const api = window.Cal.ns[namespace];
  const observer = new MutationObserver(() => {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;
    iframe.title = title;
    iframe.addEventListener('load', onLoad, { once: true });
    observer.disconnect();
  });
  observer.observe(container, { childList: true, subtree: true });
  api('inline', {
    elementOrSelector: container,
    calLink,
    config: { layout: 'month_view', theme: 'dark', locale: language, 'ui.autoscroll': 'false' }
  });
  api('ui', { theme: 'dark', layout: 'month_view', hideEventTypeDetails: false, disableAutoScroll: true });
}
