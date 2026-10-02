// Header, MobileNav and Footer from components/layout, rendered as plain DOM.
import { logout } from './api.js';
import { getCabinetHref, getStoredSession } from './session.js';
import { e, href } from './ui.js';

const mainNavItems = [
  { href: '/', label: 'Главная' },
  { href: '/search', label: 'Каталог' },
  { href: '/register-salon', label: 'Для салонов' },
  { href: '/login', label: 'Войти', variant: 'primary' }
];

const isActive = (item, pathname) => (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`));

export function renderHeader(headerEl, pathname) {
  const session = getStoredSession();
  const cabinetHref = session ? getCabinetHref(session.user.role) : undefined;
  const items = mainNavItems.filter(item => !session || (item.href !== '/login' && item.href !== '/register-salon'));
  const panelMarkup = `<nav id="mobile-nav-panel" class="mobile-nav-panel" aria-label="Мобильная навигация">
      ${items.map(item => `<a class="${item.variant === 'primary' ? 'mobile-nav-primary' : 'mobile-nav-link'}" data-active="${isActive(item, pathname)}" href="${href(item.href)}">${item.label}</a>`).join('')}
      ${session ? `<span class="mobile-nav-user">${e(session.user.name)}</span><a class="mobile-nav-primary" href="${href(cabinetHref)}">Кабинет</a><button class="mobile-nav-link" type="button" data-logout>Выйти</button>` : ''}
    </nav>`;

  headerEl.innerHTML = `
    <div class="app-header-inner">
      <a class="brand" href="${href('/')}" aria-label="BeautyBook на главную"><span>BeautyBook</span></a>
      <nav class="desktop-nav" aria-label="Основная навигация">
        ${items.map(item => `<a class="${item.variant === 'primary' ? 'nav-action' : 'nav-link'}" data-active="${isActive(item, pathname)}" href="${href(item.href)}">${item.label}</a>`).join('')}
        ${session ? `<div class="header-session"><span>${e(session.user.name)}</span><a href="${href(cabinetHref)}">Кабинет</a><button type="button" data-logout>Выйти</button></div>` : ''}
      </nav>
      <div class="header-right">
        <div class="mobile-nav">
          <button class="mobile-nav-button" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav-panel"><span></span><span></span><span></span></button>
        </div>
      </div>
    </div>`;

  const mobileNav = headerEl.querySelector('.mobile-nav');
  const toggle = headerEl.querySelector('.mobile-nav-button');
  const setOpen = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileNav.querySelector('.mobile-nav-panel')?.remove();
    if (open) mobileNav.insertAdjacentHTML('beforeend', panelMarkup);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', event => {
    if (!event.target.closest('.mobile-nav-panel a, .mobile-nav-panel button')) return;
    if (event.target.closest('[data-logout]')) logout();
    setOpen(false);
  });
  headerEl.querySelector('.desktop-nav [data-logout]')?.addEventListener('click', () => logout());
}

export function renderFooter(footerEl) {
  footerEl.innerHTML = `
    <div class="app-footer-inner">
      <div><strong>BeautyBook</strong><p>Онлайн-запись в салоны красоты, барбершопы и студии ухода в Барнауле.</p></div>
      <nav class="footer-links" aria-label="Нижнее меню">
        <a href="${href('/')}">Главная</a><a href="${href('/search')}">Каталог</a><a href="${href('/register-salon')}">Для салонов</a><a href="${href('/account')}">Личный кабинет</a>
      </nav>
      <div class="footer-contact"><span>Барнаул</span><span>Поддержка: support@beautybook.local</span><span>Ежедневно 09:00-21:00</span></div>
    </div>`;
}
