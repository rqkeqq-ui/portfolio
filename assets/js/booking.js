// Official Cal.com queue bootstrap. The remote script is requested only on opening.
export function mountCalBooking(container, { calLink, language, title, onLoad, scrollContainer }) {
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
  if (scrollContainer) followBookerSteps(api, container, scrollContainer);
}

// Below the desktop breakpoint Cal.com stacks the time slots under a tall calendar, so a tapped date
// looks inert. Once the iframe stops resizing after a step: picking a date barely changes it (scroll
// down to the slots), opening the booking form shrinks it a lot (scroll back to its start).
function followBookerSteps(api, container, scrollContainer) {
  let timer;
  let routeHeight = 0;
  const settle = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return;
      const view = scrollContainer.getBoundingClientRect();
      const frame = iframe.getBoundingClientRect();
      const offset = frame.top - view.top + scrollContainer.scrollTop;
      const toForm = frame.height < routeHeight * .75;
      routeHeight = 0;
      if (!toForm && frame.height <= scrollContainer.clientHeight) return;
      const top = toForm ? offset : offset + frame.height - scrollContainer.clientHeight;
      scrollContainer.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }, 600);
  };
  api('on', {
    action: '__routeChanged',
    callback: () => {
      routeHeight = routeHeight || container.querySelector('iframe')?.getBoundingClientRect().height || 0;
      settle();
    }
  });
  api('on', { action: '__dimensionChanged', callback: () => { if (routeHeight) settle(); } });
}
