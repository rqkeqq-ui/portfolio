// app/admin/*: AdminGuard, AdminShell, overview, users and salons tables.
import * as api from '../api.js';
import { getStoredSession } from '../session.js';
import { e, errorText, formatUtc, href } from '../ui.js';
import { guardPage } from './states.js';

const navItems = [['/admin', 'Обзор'], ['/admin/users', 'Пользователи'], ['/admin/salons', 'Салоны']];
const heroes = {
  overview: ['Администрирование', 'Контроль платформы', 'Просматривайте пользователей, салоны и общую активность сервиса.', 'Администрирование'],
  users: ['System Admin', 'Пользователи', 'Список аккаунтов и блокировка входа для выбранного пользователя.', 'System Admin · Пользователи'],
  salons: ['System Admin', 'Салоны', 'Системный обзор салонов, владельцев и показателей активности.', 'System Admin · Салоны']
};

export function adminPage(ctx) {
  const session = getStoredSession();
  if (!session) { guardPage(ctx, { kicker: 'Администратор', title: 'Нужен вход', text: 'Войдите под системным администратором, чтобы открыть панель.', link: '/login', linkClass: 'primary-link' }); return; }
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') { guardPage(ctx, { kicker: 'Администратор', title: 'Недостаточно прав', text: 'Раздел доступен только системному администратору.' }); return; }

  const section = ctx.params[0] || 'overview';
  const [kicker, title, lead, pageTitle] = heroes[section];
  ctx.setTitle(pageTitle);
  const current = section === 'overview' ? '/admin' : `/admin/${section}`;
  const shell = ctx.mount(`
    <main class="dashboard-shell">
      <aside class="dashboard-sidebar" aria-label="Навигация системного администратора">
        <div class="dashboard-sidebar-brand"><span class="brand-mark">B</span><strong>Администрирование</strong></div>
        <nav>${navItems.map(([path, label]) => `<a data-active="${path === current}" href="${href(path)}">${label}</a>`).join('')}</nav>
      </aside>
      <section class="dashboard-workspace">
        <header class="dashboard-topbar">
          <div><span>Системная панель</span><strong>${e(session.user.name ?? 'Администратор')}</strong></div>
          <nav aria-label="Быстрые действия"><a href="${href('/search')}">Каталог</a><button type="button" data-logout>Выйти</button></nav>
        </header>
        <div class="dashboard-page">
          <section class="dashboard-hero"><p class="section-kicker">${kicker}</p><h1>${title}</h1><p>${lead}</p></section>
          <div data-section><p class="account-muted">Загрузка...</p></div>
        </div>
      </section>
    </main>`);
  shell.querySelector('[data-logout]').addEventListener('click', () => api.logout());
  const body = shell.querySelector('[data-section]');
  ({ overview, users, salons })[section](body, ctx, session);
}

async function overview(body, ctx) {
  body.innerHTML = '<p class="account-muted">Загрузка системной статистики...</p>';
  try {
    const summary = await api.getSuperAdminSummary();
    if (!ctx.alive()) return;
    const labels = [['usersTotal', 'Пользователи', 'Все зарегистрированные аккаунты', 'teal'], ['salonsTotal', 'Салоны', 'Карточки салонов в системе', 'gold'], ['bookingsTotal', 'Записи', 'Все бронирования платформы', 'violet'], ['blockedUsers', 'Блокировки', 'Аккаунты с закрытым входом', 'coral']];
    body.innerHTML = `<section class="dashboard-summary-grid" aria-label="Системная статистика">${labels.map(([key, label, detail, tone]) => `<article class="dashboard-summary-card" data-tone="${tone}"><span>${label}</span><strong>${summary[key]}</strong><p>${detail}</p></article>`).join('')}</section>`;
  } catch (error) {
    if (ctx.alive()) body.innerHTML = `<p class="auth-error">${e(errorText(error, 'Не удалось загрузить системную статистику'))}</p>`;
  }
}

async function users(body, ctx, session) {
  let list = [];
  let error;
  const render = () => {
    body.innerHTML = `<section class="dashboard-panel admin-table-panel">
      <div class="dashboard-panel-heading"><div><h2>Пользователи</h2><p>Блокировка запрещает новый вход и удаляет активные refresh-сессии.</p></div><span>${list.length} записей</span></div>
      ${error ? `<p class="auth-error">${e(error)}</p>` : ''}
      <div class="admin-table" role="table" aria-label="Пользователи системы">
        <div class="admin-table-head" role="row"><span>Email</span><span>Имя</span><span>Роль</span><span>Дата</span><span>Статус</span></div>
        ${list.map(user => `<div class="admin-table-row" role="row"><span>${e(user.email)}</span><span>${e(user.name)}</span><span>${user.role}</span><span>${formatUtc(user.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <button class="dashboard-inline-action" data-user="${user.id}" ${user.id === session.user.id ? 'disabled' : ''} type="button">${user.isBlocked ? 'Разблокировать' : 'Заблокировать'}</button></div>`).join('')}
      </div>
    </section>`;
  };
  try { list = await api.listSuperAdminUsers(); } catch (caught) { error = errorText(caught, 'Не удалось загрузить пользователей'); }
  if (!ctx.alive()) return;
  render();
  body.addEventListener('click', async event => {
    const button = event.target.closest('[data-user]');
    if (!button || button.disabled) return;
    button.disabled = true;
    error = undefined;
    const user = list.find(item => item.id === button.dataset.user);
    try {
      const updated = await api.setSuperAdminUserBlocked(user.id, !user.isBlocked);
      list = list.map(item => (item.id === updated.id ? updated : item));
    } catch (caught) {
      error = errorText(caught, 'Не удалось изменить статус пользователя');
    }
    if (ctx.alive()) render();
  });
}

async function salons(body, ctx) {
  let list = [];
  let error;
  try { list = await api.listSuperAdminSalons(); } catch (caught) { error = errorText(caught, 'Не удалось загрузить салоны'); }
  if (!ctx.alive()) return;
  body.innerHTML = `<section class="dashboard-panel admin-table-panel">
    <div class="dashboard-panel-heading"><div><h2>Салоны</h2><p>Сводная таблица карточек салонов, владельцев и активности.</p></div><span>${list.length} записей</span></div>
    ${error ? `<p class="auth-error">${e(error)}</p>` : ''}
    <div class="admin-table admin-salons-table" role="table" aria-label="Салоны системы">
      <div class="admin-table-head" role="row"><span>Салон</span><span>Владелец</span><span>Район</span><span>Рейтинг</span><span>Активность</span></div>
      ${list.map(salon => `<div class="admin-table-row" role="row">
        <span><strong>${e(salon.name)}</strong><small>${e(salon.slug)}</small></span>
        <span><strong>${e(salon.owner?.name ?? 'Без владельца')}</strong><small>${e(salon.owner?.email ?? 'owner не назначен')}</small></span>
        <span>${e(salon.area)}</span>
        <span>${salon.rating.toFixed(1)} / ${salon.reviewCount} отзывов</span>
        <span>${salon.bookingsCount} записей · ${salon.servicesCount} услуг · ${salon.mastersCount} мастеров</span>
      </div>`).join('')}
    </div>
  </section>`;
}
