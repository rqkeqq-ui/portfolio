// Finished sites shown live in the project page frame. Static sites are copied by tools/sync-demos.mjs,
// Next.js projects are exported by tools/export-next-demos.mjs with basePath /portfolio/projects/<slug>/app.
const PAGES_BASE = '/portfolio';

// The Next.js exports only recognise their own basePath; locally the portfolio runs from the root,
// where the Vite dev server maps /portfolio/* back onto it.
function nextSrc(root, path) {
  const url = new URL(root(path), location.href);
  return url.pathname.startsWith(`${PAGES_BASE}/`) ? url.href : new URL(PAGES_BASE + url.pathname, location.href).href;
}

const sections = ru => (ru
  ? { site: 'Сайт', app: 'Приложение', track: 'Отслеживание заказа', offer: 'Пример КП', configurator: 'Конфигуратор', calc: 'Расчёт' }
  : { site: 'Website', app: 'App', track: 'Order tracking', offer: 'Sample proposal', configurator: 'Configurator', calc: 'Estimate' });

const configs = {
  northcut: { next: true, host: 'northcut.demo/', title: 'North Cut', roles: [], screens: { services: '#services', masters: '#masters', works: '#works', booking: '#booking' } },
  'weekly-table': { next: true, host: 'weekly-table.demo/', title: 'WEEKLY TABLE', roles: [], screens: { menu: '#menu', control: '#control', builder: '#builder', delivery: '#delivery' } },
  'verde-office': {
    host: 'verde-office.demo/', title: 'Verde Office',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'offer', label: t.offer, route: ['kp-example.html'] }],
    roleOf: path => (path.startsWith('kp-example') ? 'offer' : 'site'),
    screens: { calc: '#calc', plan: '#plan', kp: 'kp-example.html', sla: '#sla' }
  },
  'therma-home': {
    host: 'therma-home.demo/', title: 'Therma Home',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'calc', label: t.calc, route: ['#calc'] }],
    roleOf: path => (path.startsWith('#calc') ? 'calc' : 'site'),
    screens: { calc: '#calc', price: '#price', cases: '#cases', economy: '#economy' }
  },
  pawline: {
    host: 'pawline.demo/', title: 'PAWLINE',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'app', label: t.app, route: ['app/'] }],
    roleOf: path => (path.startsWith('app/') ? 'app' : 'site'),
    screens: { today: 'app/', features: '#features', scenarios: '#scenarios', pricing: '#pricing' }
  },
  'nord-module': {
    host: 'nord-module.demo/', title: 'Nord Module',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'configurator', label: t.configurator, route: ['#configurator'] }],
    roleOf: path => (path.startsWith('#configurator') ? 'configurator' : 'site'),
    screens: { configurator: '#configurator', size: '#size', delivery: '#delivery', projects: '#projects' }
  },
  'lumen-event': {
    host: 'lumen-event.demo/', title: 'Lumen Event',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'configurator', label: t.configurator, route: ['#constructor'] }],
    roleOf: path => (path.startsWith('#constructor') || path.startsWith('#atmosphere') ? 'configurator' : 'site'),
    screens: { atmosphere: '#atmosphere', constructor: '#constructor', result: '#result', portfolio: '#portfolio' }
  },
  fixflow: {
    next: true, host: 'fixflow.demo/', title: 'FixFlow',
    roles: t => [{ id: 'site', label: t.site, route: [''] }, { id: 'track', label: t.track, route: ['track/?order=4902'] }],
    roleOf: path => (path.startsWith('track') ? 'track' : 'site'),
    screens: { request: '#process', track: 'track/?order=4902', cabinet: '#cabinet', pricing: '#pricing' }
  }
};

export const siteDemoSlugs = Object.keys(configs);

export function createSiteDemo(slug, { lang, root }) {
  const config = configs[slug];
  if (!config) return null;
  const ru = lang === 'ru';
  const t = sections(ru);
  const path = `projects/${slug}/app/`;
  const roles = typeof config.roles === 'function' ? config.roles(t) : config.roles;
  return {
    type: 'site',
    title: `${config.title} — ${ru ? 'интерактивная версия' : 'interactive version'}`,
    src: config.next ? nextSrc(root, path) : new URL(root(path), location.href).href,
    host: config.host,
    start: '',
    roles,
    roleOf: config.roleOf || (() => roles[0]?.id),
    screens: Object.fromEntries(Object.entries(config.screens).map(([key, target]) => [key, [target]]))
  };
}
