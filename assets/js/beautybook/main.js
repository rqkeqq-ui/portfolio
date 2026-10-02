// Hash router replacing the Next.js app directory; layout (header/footer) persists between pages.
import { loginAsDemo, resetDemo } from './api.js';
import { renderFooter, renderHeader } from './layout.js';
import { accountPage } from './pages/account.js';
import { adminPage } from './pages/admin.js';
import { loginPage, registerPage, registerSalonPage } from './pages/auth.js';
import { bookingPage } from './pages/booking.js';
import { dashboardPage } from './pages/dashboard.js';
import { homePage } from './pages/home.js';
import { salonPage } from './pages/salon.js';
import { searchPage } from './pages/search.js';
import { errorPage, loadingMarkup, notFoundPage } from './pages/states.js';
import { getCabinetHref, onSessionChange } from './session.js';

const demoRoles = { client: 'CLIENT', owner: 'SALON_OWNER', admin: 'SUPER_ADMIN' };

async function demoPage(ctx) {
  if (ctx.params[0] === 'reset') { resetDemo(); ctx.navigate('/', { replace: true }); return; }
  const session = await loginAsDemo(demoRoles[ctx.params[0]]);
  ctx.navigate(ctx.query.get('to') || getCabinetHref(session.user.role), { replace: true });
}

const routes = [
  [/^\/$/, homePage],
  [/^\/search$/, searchPage],
  [/^\/salons\/([^/]+)$/, salonPage],
  [/^\/booking\/([^/]+)$/, bookingPage],
  [/^\/login$/, loginPage],
  [/^\/register$/, registerPage],
  [/^\/register-salon$/, registerSalonPage],
  [/^\/account(?:\/(?:bookings|reviews))?$/, accountPage],
  [/^\/dashboard(?:\/(settings|services|masters|schedule|bookings))?$/, dashboardPage],
  [/^\/admin(?:\/(users|salons))?$/, adminPage],
  [/^\/demo\/(client|owner|admin|reset)$/, demoPage]
];
const guarded = /^\/(account|dashboard|admin)(\/|$)/;

const header = document.querySelector('.app-header');
const footer = document.querySelector('.app-footer');
let current = document.querySelector('[data-page]');
let token = 0;
let pathname = '/';

const parseHash = () => {
  const [path, search = ''] = (location.hash.slice(1) || '/').split('?');
  return { path: decodeURI(path) || '/', search };
};

function mountMarkup(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const node = template.content.firstElementChild;
  current.replaceWith(node);
  current = node;
  return node;
}

function navigate(path, { replace = false } = {}) {
  if (`#${path}` === location.hash) { route(); return; }
  if (replace) location.replace(`#${path}`);
  else location.hash = path;
}

async function route() {
  const { path, search } = parseHash();
  const myToken = ++token;
  const samePage = path === pathname;
  pathname = path;
  let mounted = false;
  const ctx = {
    params: [],
    query: new URLSearchParams(search),
    alive: () => myToken === token,
    mount: html => { mounted = true; return ctx.alive() ? mountMarkup(html) : document.createElement('div'); },
    navigate,
    replaceUrl: next => history.pushState(null, '', `#${next}`),
    setTitle: title => { document.title = title; }
  };
  renderHeader(header, path);
  if (!samePage) scrollTo(0, 0);
  parent?.postMessage?.({ type: 'beautybook:route', path: `${path}${search ? `?${search}` : ''}` }, location.origin);

  const match = routes.map(([pattern, page]) => [path.match(pattern), page]).find(([result]) => result);
  if (!match) { notFoundPage(ctx); return; }
  ctx.params = match[0].slice(1);
  const slow = setTimeout(() => { if (ctx.alive() && !mounted) mountMarkup(loadingMarkup); }, 220);
  try {
    await match[1](ctx);
  } catch (error) {
    console.error(error);
    if (ctx.alive()) errorPage(ctx, error, route);
  } finally {
    clearTimeout(slow);
  }
}

renderFooter(footer);
addEventListener('hashchange', route);
onSessionChange(() => {
  renderHeader(header, pathname);
  if (guarded.test(pathname)) route();
});
route();
