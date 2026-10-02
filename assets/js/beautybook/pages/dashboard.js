// app/dashboard/*: layout guard, sidebar, topbar and every owner section.
import * as api from '../api.js';
import { getStoredSession } from '../session.js';
import { centsToRub, e, errorText, formatUtc, href, readImageFile, readNumber } from '../ui.js';
import { guardPage } from './states.js';

const navItems = [['/dashboard', 'Обзор'], ['/dashboard/settings', 'Профиль салона'], ['/dashboard/services', 'Услуги'], ['/dashboard/masters', 'Мастера'], ['/dashboard/schedule', 'Расписание'], ['/dashboard/bookings', 'Записи']];
const heroes = {
  overview: ['Кабинет салона', 'Рабочий день салона', 'Следите за ближайшими визитами, выручкой и загрузкой мастеров в одном месте.', 'Кабинет салона'],
  bookings: ['Bookings', 'Записи салона', 'Реальные бронирования из базы данных: фильтрация, смена статуса, отмена и завершение визита.', 'Записи салона | BeautyBook'],
  masters: ['Мастера', 'Команда салона', 'Создавайте мастеров, связывайте их с услугами и отключайте тех, кто временно не принимает записи.', 'Мастера салона'],
  schedule: ['Расписание', 'График мастеров', 'Задавайте рабочие дни, шаг слота и блокировки конкретных интервалов для каждого мастера.', 'Расписание мастеров'],
  services: ['Услуги', 'Каталог услуг', 'Создавайте и редактируйте услуги салона. Активные услуги сразу доступны публичной карточке и сценарию записи.', 'Услуги салона'],
  settings: ['Настройки', 'Профиль салона', 'Заполните публичные данные салона: название, район, адрес, телефон и описание для клиентов.', 'Настройки салона']
};
const statusLabels = { PENDING: 'Ожидает', CONFIRMED: 'Подтверждена', CANCELLED: 'Отменена', COMPLETED: 'Завершена' };
const statusOptions = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const messageMarkup = (status, message) => (message ? `<p class="${status === 'error' ? 'auth-error' : 'dashboard-settings-success'}">${e(message)}</p>` : '');

export function dashboardPage(ctx) {
  const session = getStoredSession();
  const redirect = !session ? '/login' : session.user.role === 'SALON_OWNER' ? undefined : (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') ? '/admin' : '/account';
  if (redirect) {
    guardPage(ctx, { kicker: 'Доступ к кабинету', title: redirect === '/login' ? 'Нужен вход' : 'Открываем подходящий кабинет', text: redirect === '/login' ? 'Войдите как администратор салона, чтобы открыть управление.' : 'Для вашей роли доступен другой раздел платформы.', link: redirect });
    if (redirect !== '/login') ctx.navigate(redirect, { replace: true });
    return;
  }

  const section = ctx.params[0] || 'overview';
  const [kicker, title, lead, pageTitle] = heroes[section];
  ctx.setTitle(pageTitle);
  const current = section === 'overview' ? '/dashboard' : `/dashboard/${section}`;
  const shell = ctx.mount(`
    <main class="dashboard-shell">
      <aside class="dashboard-sidebar" aria-label="Навигация панели салона">
        <div class="dashboard-sidebar-brand"><span class="brand-mark">B</span><strong>BeautyBook</strong></div>
        <nav>${navItems.map(([path, label]) => `<a data-active="${path === current}" href="${href(path)}">${label}</a>`).join('')}</nav>
      </aside>
      <section class="dashboard-workspace">
        <header class="dashboard-topbar">
          <div><span>Кабинет салона</span><strong>${e(session.user.name ?? 'Администратор')}</strong></div>
          <nav aria-label="Быстрые действия"><a href="${href('/search')}">Каталог</a><button type="button" data-logout>Выйти</button></nav>
        </header>
        <div class="dashboard-page">
          <section class="dashboard-hero"><p class="section-kicker">${kicker}</p><h1>${title}</h1><p>${lead}</p></section>
          <div data-section></div>
        </div>
      </section>
    </main>`);
  shell.querySelector('[data-logout]').addEventListener('click', () => api.logout());
  const body = shell.querySelector('[data-section]');
  ({ overview, bookings, masters, schedule, services, settings })[section](body, ctx);
}

/* ---------- Overview ---------- */
async function overview(body, ctx) {
  body.innerHTML = '<p class="account-muted">Загрузка кабинета...</p>';
  try {
    const [summary, points, bookings] = await Promise.all([api.getDashboardSummary(), api.getBookingsChart(), api.listSalonBookings({ status: 'CONFIRMED' })]);
    if (!ctx.alive()) return;
    const cards = [
      ['Записи сегодня', String(summary.bookingsToday), 'Активные визиты на текущую дату', 'teal'],
      ['Выручка за неделю', centsToRub(summary.weeklyRevenueCents), 'Сумма завершённых записей за последние 7 дней', 'gold'],
      ['Ближайшие записи', String(summary.upcomingBookings), 'Подтверждённые будущие визиты салона', 'violet'],
      ['Новые клиенты', String(summary.newClients), `Средний рейтинг салона: ${summary.averageRating.toFixed(1)}`, 'coral']
    ];
    const maxBookings = Math.max(1, ...points.map(point => point.bookings));
    const maxRevenue = Math.max(1, ...points.map(point => point.revenueCents));
    const formatDay = value => formatUtc(`${value}T00:00:00.000Z`, { day: '2-digit', month: '2-digit' });
    const upcoming = bookings.filter(item => item.status === 'CONFIRMED' || item.status === 'PENDING').slice(0, 5);
    body.outerHTML = `
      <section class="dashboard-summary-grid" aria-label="Ключевые показатели">
        ${cards.map(([label, value, detail, tone]) => `<article class="dashboard-summary-card" data-tone="${tone}"><span>${label}</span><strong>${value}</strong><p>${detail}</p></article>`).join('')}
      </section>
      <section class="dashboard-panel bookings-chart" aria-label="График записей за 30 дней">
        <div class="dashboard-panel-heading">
          <div><h2>Динамика за 30 дней</h2><p>Записи показаны по активным броням, выручка учитывает завершённые визиты.</p></div>
          <span>${points.reduce((sum, point) => sum + point.bookings, 0)} записей · ${centsToRub(points.reduce((sum, point) => sum + point.revenueCents, 0))}</span>
        </div>
        <div class="bookings-chart-grid" role="list">
          ${points.map((point, index) => `<div class="bookings-chart-day" role="listitem" style="--booking-height:${Math.max(4, (point.bookings / maxBookings) * 100)}%;--revenue-height:${Math.max(4, (point.revenueCents / maxRevenue) * 100)}%" title="${formatDay(point.date)}: ${point.bookings} записей, ${centsToRub(point.revenueCents)}">
            <span class="bookings-chart-count">${point.bookings}</span>
            <div class="bookings-chart-bars" aria-hidden="true"><span class="bookings-chart-bar bookings-chart-bar-bookings"></span><span class="bookings-chart-bar bookings-chart-bar-revenue"></span></div>
            <span class="bookings-chart-date">${index % 5 === 0 || index === points.length - 1 ? formatDay(point.date) : ''}</span>
          </div>`).join('')}
        </div>
        <div class="bookings-chart-legend" aria-label="Легенда графика"><span data-kind="bookings">Записи</span><span data-kind="revenue">Выручка</span></div>
      </section>
      <section class="dashboard-panel" aria-labelledby="upcoming-bookings-title">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Расписание</p><h2 id="upcoming-bookings-title">Ближайшие записи</h2></div></div>
        <div class="dashboard-booking-list">
          ${upcoming.length ? '' : '<p class="account-muted">Ближайших записей пока нет.</p>'}
          ${upcoming.map(item => `<article class="dashboard-booking-row">
            <div><strong>${e(item.customerName)}</strong><span>${e(item.service?.name ?? 'Услуга')}</span></div>
            <div><span>${e(item.master?.name ?? 'Мастер')}</span><b>${formatUtc(item.startsAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b></div>
            <div><span data-status="${item.status}">${statusLabels[item.status]}</span><b>${centsToRub(item.totalPriceCents)}</b></div>
          </article>`).join('')}
        </div>
      </section>`;
  } catch (error) {
    if (!ctx.alive()) return;
    if (error.code === 'SALON_NOT_FOUND') {
      body.innerHTML = `<section class="dashboard-panel"><p class="section-kicker">Новый салон</p><h2>Добавьте салон</h2><p class="account-muted">Заполните карточку салона, чтобы открыть показатели, услуги и расписание.</p><a class="card-action dashboard-settings-submit" href="${href('/dashboard/settings')}">Добавить салон</a></section>`;
    } else if (error.status === 401) {
      body.innerHTML = `<section class="dashboard-panel"><p class="section-kicker">Сессия истекла</p><h2>Войдите снова</h2><p class="account-muted">Срок действия входа закончился. После входа кабинет снова откроется.</p><a class="card-action dashboard-settings-submit" href="${href('/login')}">Войти</a></section>`;
    } else {
      body.innerHTML = `<p class="auth-error">${e(errorText(error, 'Не удалось загрузить кабинет салона'))}</p>`;
    }
  }
}

/* ---------- Bookings ---------- */
function bookings(body, ctx) {
  const filter = { date: '', masterId: '', status: '' };
  let list = [];
  let masters = [];
  let error;
  let loading = true;

  body.innerHTML = `
    <section class="dashboard-panel dashboard-bookings-panel" aria-labelledby="dashboard-bookings-title">
      <div class="dashboard-panel-heading"><div><p class="section-kicker">Записи</p><h2 id="dashboard-bookings-title">Бронирования салона</h2></div></div>
      <div class="dashboard-booking-filters">
        <label>Дата<input max="2030-12-31" type="date" data-filter="date"></label>
        <label>Мастер<select data-filter="masterId"><option value="">Все мастера</option></select></label>
        <label>Статус<select data-filter="status"><option value="">Все статусы</option>${statusOptions.map(status => `<option value="${status}">${statusLabels[status]}</option>`).join('')}</select></label>
        <button type="button" data-today>Сегодня</button>
      </div>
      <div data-rows></div>
    </section>`;
  const rows = body.querySelector('[data-rows]');
  const masterSelect = body.querySelector('[data-filter="masterId"]');

  function render() {
    const seen = new Map(masters.map(master => [master.id, master.name]));
    list.forEach(item => item.master && seen.set(item.master.id, item.master.name));
    masters = [...seen].map(([id, name]) => ({ id, name }));
    masterSelect.innerHTML = `<option value="">Все мастера</option>${masters.map(master => `<option value="${master.id}" ${filter.masterId === master.id ? 'selected' : ''}>${e(master.name)}</option>`).join('')}`;
    rows.innerHTML = `
      ${error ? `<p class="auth-error">${e(error)}</p>` : ''}
      ${loading ? '<p class="account-muted">Загрузка записей...</p>' : ''}
      ${!loading && !list.length ? '<p class="account-muted">Записей по выбранным фильтрам нет.</p>' : ''}
      ${list.length ? `<div class="dashboard-bookings-table">
        <div class="dashboard-bookings-head"><span>Клиент</span><span>Услуга</span><span>Время</span><span>Статус</span><span>Действия</span></div>
        ${list.map(item => `<article class="dashboard-bookings-row" data-id="${item.id}">
          <div><strong>${e(item.customerName)}</strong><span>${e(item.customerPhone)}</span></div>
          <div><strong>${e(item.service?.name ?? 'Услуга')}</strong><span>${e(item.master?.name ?? 'Мастер')}</span></div>
          <div><strong>${formatUtc(item.startsAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong><span>${centsToRub(item.totalPriceCents)}</span></div>
          <select data-status>${statusOptions.map(status => `<option value="${status}" ${item.status === status ? 'selected' : ''}>${statusLabels[status]}</option>`).join('')}</select>
          <div class="dashboard-booking-actions">
            <button type="button" data-complete ${item.status === 'COMPLETED' ? 'disabled' : ''}>Завершить</button>
            ${item.status !== 'CANCELLED' ? `<details class="dashboard-cancel-details"><summary>Отменить</summary><div><label>Причина отмены<input data-reason placeholder="Например: ${e(item.customerName)}"></label><button type="button" data-cancel>Подтвердить отмену</button></div></details>` : ''}
          </div>
        </article>`).join('')}
      </div>` : ''}`;
  }

  async function load() {
    loading = true;
    error = undefined;
    render();
    try {
      list = await api.listSalonBookings(filter);
    } catch (caught) {
      error = errorText(caught, 'Не удалось загрузить записи');
    }
    loading = false;
    if (ctx.alive()) render();
  }

  async function changeStatus(row, status, reason) {
    row.querySelectorAll('button, select, input').forEach(control => { control.disabled = true; });
    try {
      const updated = await api.updateSalonBookingStatus(row.dataset.id, status, reason);
      list = list.map(item => (item.id === updated.id ? updated : item));
    } catch (caught) {
      error = errorText(caught, 'Не удалось обновить статус');
    }
    if (ctx.alive()) render();
  }

  body.addEventListener('change', event => {
    const key = event.target.dataset.filter;
    if (key) { filter[key] = event.target.value; load(); return; }
    if (event.target.matches('[data-status]')) changeStatus(event.target.closest('[data-id]'), event.target.value);
  });
  body.addEventListener('click', event => {
    if (event.target.closest('[data-today]')) {
      filter.date = new Date().toLocaleDateString('en-CA');
      body.querySelector('[data-filter="date"]').value = filter.date;
      load();
    }
    const row = event.target.closest('[data-id]');
    if (!row) return;
    if (event.target.closest('[data-complete]')) changeStatus(row, 'COMPLETED');
    if (event.target.closest('[data-cancel]')) changeStatus(row, 'CANCELLED', row.querySelector('[data-reason]').value);
  });
  load();
}

/* ---------- Services ---------- */
const categoryOptions = [['hair', 'Стрижки'], ['nails', 'Маникюр'], ['barber', 'Барберинг'], ['cosmetology', 'Косметология'], ['massage', 'Массаж']];

function services(body, ctx) {
  const state = { services: [], selected: undefined, status: 'loading', message: undefined };

  function formMarkup(selected) {
    const editing = Boolean(selected);
    return `<form class="dashboard-settings-form" data-service-form>
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Услуга</p><h2>${editing ? 'Редактирование' : 'Новая услуга'}</h2></div>${editing ? '<button class="dashboard-inline-action" type="button" data-cancel-edit>Сбросить</button>' : ''}</div>
        <div class="dashboard-settings-grid">
          <label><span>Название</span><input name="name" required value="${e(selected?.name ?? '')}"></label>
          <label><span>Категория</span><select name="category" required>${categoryOptions.map(([value, label]) => `<option value="${value}" ${(selected?.category ?? 'hair') === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
          <label><span>Длительность, мин</span><input min="15" name="durationMinutes" required type="number" value="${selected?.durationMinutes ?? 45}"></label>
          <label><span>Цена, ₽</span><input min="0" name="price" required type="number" value="${selected?.price ?? 2000}"></label>
          <label class="dashboard-settings-wide"><span>Описание</span><textarea name="description" required rows="4">${e(selected?.description ?? '')}</textarea></label>
          <label class="dashboard-checkbox-row"><input name="isActive" type="checkbox" ${(selected?.isActive ?? true) ? 'checked' : ''}><span>Показывать услугу на публичной карточке</span></label>
        </div>
      </section>
      <button class="card-action dashboard-settings-submit" type="submit">${editing ? 'Сохранить услугу' : 'Создать услугу'}</button>
    </form>`;
  }

  function render() {
    body.innerHTML = `<div class="dashboard-services-grid">
      ${formMarkup(state.selected)}
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Каталог</p><h2>Услуги салона</h2></div><span>${state.services.length}</span></div>
        ${messageMarkup(state.status, state.message)}
        ${state.status === 'loading' ? '<p class="dashboard-settings-state">Загрузка услуг...</p>' : ''}
        <div class="dashboard-service-list">${state.services.map(item => `<article class="dashboard-service-row" data-active="${item.isActive}" data-id="${item.id}">
          <div><strong>${e(item.name)}</strong><span>${e(item.description)}</span></div>
          <div><b>${item.price.toLocaleString('ru-RU')} ₽</b><span>${item.durationMinutes} мин</span></div>
          <div class="dashboard-service-actions"><button type="button" data-edit>Изменить</button><button type="button" data-toggle>${item.isActive ? 'Скрыть' : 'Включить'}</button></div>
        </article>`).join('')}</div>
      </section>
    </div>`;
  }

  async function run(action, success) {
    state.status = 'saving';
    state.message = undefined;
    try {
      const saved = await action();
      const exists = state.services.some(item => item.id === saved.id);
      state.services = exists ? state.services.map(item => (item.id === saved.id ? saved : item)) : [saved, ...state.services];
      state.status = 'ready';
      state.message = success(saved);
      state.selected = undefined;
    } catch (error) {
      state.status = 'error';
      state.message = errorText(error, 'Не удалось сохранить услугу');
    }
    if (ctx.alive()) render();
  }

  body.addEventListener('submit', event => {
    if (!event.target.matches('[data-service-form]')) return;
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = { name: String(form.get('name') ?? ''), description: String(form.get('description') ?? ''), category: String(form.get('category') ?? ''), durationMinutes: readNumber(form, 'durationMinutes'), price: readNumber(form, 'price'), isActive: form.get('isActive') === 'on' };
    const id = state.selected?.id;
    event.target.querySelector('[type="submit"]').textContent = 'Сохранение...';
    run(() => (id ? api.updateDashboardService(id, payload) : api.createDashboardService(payload)), () => (id ? 'Услуга обновлена' : 'Услуга создана'));
  });
  body.addEventListener('click', event => {
    if (event.target.closest('[data-cancel-edit]')) { state.selected = undefined; render(); return; }
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const item = state.services.find(entry => entry.id === row.dataset.id);
    if (event.target.closest('[data-edit]')) { state.selected = item; render(); body.querySelector('[data-service-form]').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (event.target.closest('[data-toggle]')) run(() => api.updateDashboardService(item.id, { isActive: !item.isActive }), saved => (saved.isActive ? 'Услуга включена' : 'Услуга скрыта'));
  });

  render();
  api.listDashboardServices().then(list => { state.services = list; state.status = 'ready'; }).catch(error => { state.status = 'error'; state.message = errorText(error, 'Не удалось загрузить услуги'); }).finally(() => ctx.alive() && render());
}

/* ---------- Masters ---------- */
function masters(body, ctx) {
  const state = { masters: [], services: [], selected: undefined, status: 'loading', message: undefined, formError: undefined };

  function formMarkup(selected) {
    const editing = Boolean(selected);
    const selectedIds = selected?.services.map(item => item.id) ?? [];
    return `<form class="dashboard-settings-form" data-master-form>
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Мастер</p><h2>${editing ? 'Редактирование' : 'Новый мастер'}</h2></div>${editing ? '<button class="dashboard-inline-action" type="button" data-cancel-edit>Сбросить</button>' : ''}</div>
        <div class="dashboard-settings-grid">
          <label><span>Имя</span><input name="name" required value="${e(selected?.name ?? '')}"></label>
          <label><span>Специализация</span><input name="role" placeholder="Парикмахер-стилист" required value="${e(selected?.role ?? '')}"></label>
          <label><span>Опыт, лет</span><input min="0" name="experienceYears" required type="number" value="${selected?.experienceYears ?? 3}"></label>
          <label><span>Фото мастера</span><input accept="image/jpeg,image/png,image/webp" name="imageFile" type="file"></label>
          <label><span>Фото URL</span><input name="imageUrl" placeholder="https://..." type="url" value="${/^https?:/.test(selected?.imageUrl ?? '') ? e(selected.imageUrl) : ''}"></label>
          <label class="dashboard-settings-wide"><span>Описание</span><textarea name="bio" rows="4">${e(selected?.bio ?? '')}</textarea></label>
          <label class="dashboard-checkbox-row"><input name="isActive" type="checkbox" ${(selected?.isActive ?? true) ? 'checked' : ''}><span>Мастер активен и виден клиентам</span></label>
        </div>
        <fieldset class="dashboard-service-picker"><legend>Услуги мастера</legend>
          ${state.services.length ? state.services.map(item => `<label><input name="serviceIds" type="checkbox" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}><span>${e(item.name)}</span></label>`).join('') : '<p class="dashboard-settings-state">Сначала создайте услуги салона.</p>'}
        </fieldset>
        ${state.formError ? `<p class="auth-error">${e(state.formError)}</p>` : ''}
      </section>
      <button class="card-action dashboard-settings-submit" type="submit">${editing ? 'Сохранить мастера' : 'Создать мастера'}</button>
    </form>`;
  }

  function render() {
    body.innerHTML = `<div class="dashboard-services-grid">
      ${formMarkup(state.selected)}
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Команда</p><h2>Мастера салона</h2></div><span>${state.masters.length}</span></div>
        ${messageMarkup(state.status, state.message)}
        ${state.status === 'loading' ? '<p class="dashboard-settings-state">Загрузка мастеров...</p>' : ''}
        <div class="dashboard-service-list">${state.masters.map(item => `<article class="dashboard-service-row" data-active="${item.isActive}" data-id="${item.id}">
          <div><strong>${e(item.name)}</strong><span>${e(item.role)}</span><span>${e(item.services.map(service => service.name).join(', ') || 'Услуги не выбраны')}</span></div>
          <div><b>${item.experienceYears} лет</b><span>${item.rating.toFixed(1)} рейтинг</span></div>
          <div class="dashboard-service-actions"><button type="button" data-edit>Изменить</button><button type="button" data-toggle>${item.isActive ? 'Скрыть' : 'Включить'}</button><button class="danger-action" type="button" data-delete>Удалить</button></div>
        </article>`).join('')}</div>
      </section>
    </div>`;
  }

  async function run(action, apply, fallback) {
    state.status = 'saving';
    state.message = undefined;
    try {
      apply(await action());
      state.status = 'ready';
    } catch (error) {
      state.status = 'error';
      state.message = errorText(error, fallback);
    }
    if (ctx.alive()) render();
  }

  body.addEventListener('submit', async event => {
    if (!event.target.matches('[data-master-form]')) return;
    event.preventDefault();
    const form = new FormData(event.target);
    const id = state.selected?.id;
    state.formError = undefined;
    let imageUrl;
    try {
      imageUrl = (await readImageFile(form, 'imageFile')) ?? String(form.get('imageUrl') ?? '').trim();
    } catch (error) {
      state.formError = error.message;
      render();
      return;
    }
    const payload = { name: String(form.get('name') ?? '').trim(), role: String(form.get('role') ?? '').trim(), bio: String(form.get('bio') ?? '').trim(), experienceYears: readNumber(form, 'experienceYears'), imageUrl, isActive: form.get('isActive') === 'on', serviceIds: form.getAll('serviceIds').map(String) };
    event.target.querySelector('[type="submit"]').textContent = 'Сохранение...';
    run(() => (id ? api.updateDashboardMaster(id, payload) : api.createDashboardMaster(payload)), saved => {
      const exists = state.masters.some(item => item.id === saved.id);
      state.masters = exists ? state.masters.map(item => (item.id === saved.id ? saved : item)) : [saved, ...state.masters];
      state.selected = undefined;
      state.message = id ? 'Мастер обновлён' : 'Мастер создан';
    }, 'Не удалось сохранить мастера');
  });

  body.addEventListener('click', event => {
    if (event.target.closest('[data-cancel-edit]')) { state.selected = undefined; render(); return; }
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const item = state.masters.find(entry => entry.id === row.dataset.id);
    if (event.target.closest('[data-edit]')) { state.selected = item; render(); body.querySelector('[data-master-form]').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (event.target.closest('[data-toggle]')) {
      run(() => api.updateDashboardMaster(item.id, { isActive: !item.isActive }), saved => {
        state.masters = state.masters.map(entry => (entry.id === saved.id ? saved : entry));
        state.message = saved.isActive ? 'Мастер активирован' : 'Мастер скрыт';
      }, 'Не удалось изменить статус мастера');
    }
    if (event.target.closest('[data-delete]') && window.confirm(`Удалить мастера ${item.name}? Действие нельзя отменить.`)) {
      run(() => api.deleteDashboardMaster(item.id), () => {
        state.masters = state.masters.filter(entry => entry.id !== item.id);
        if (state.selected?.id === item.id) state.selected = undefined;
        state.message = 'Мастер удалён';
      }, 'Не удалось удалить мастера');
    }
  });

  render();
  Promise.all([api.listDashboardMasters(), api.listDashboardServices()])
    .then(([masterList, serviceList]) => { state.masters = masterList; state.services = serviceList; state.status = 'ready'; })
    .catch(error => { state.status = 'error'; state.message = errorText(error, 'Не удалось загрузить мастеров'); })
    .finally(() => ctx.alive() && render());
}

/* ---------- Schedule ---------- */
async function schedule(body, ctx) {
  let list = [];
  let loadError;
  try { list = await api.listDashboardMasters(); } catch (error) { loadError = errorText(error, 'Не удалось загрузить мастеров'); }
  if (!ctx.alive()) return;
  const masterOptions = list.map(master => `<option value="${master.id}">${e(master.name)}</option>`).join('');
  const days = [['MONDAY', 'Понедельник'], ['TUESDAY', 'Вторник'], ['WEDNESDAY', 'Среда'], ['THURSDAY', 'Четверг'], ['FRIDAY', 'Пятница'], ['SATURDAY', 'Суббота'], ['SUNDAY', 'Воскресенье']];
  body.innerHTML = `<div class="dashboard-services-grid">
    <form class="dashboard-settings-form" data-hours>
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Рабочие часы</p><h2>График мастера</h2></div></div>
        <div class="dashboard-settings-grid">
          <label><span>Мастер</span><select name="masterId" required>${masterOptions}</select></label>
          <label><span>День</span><select name="weekday" required>${days.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
          <label><span>Начало</span><input name="opensAt" required type="time" value="09:00"></label>
          <label><span>Конец</span><input name="closesAt" required type="time" value="18:00"></label>
          <label><span>Шаг слота</span><select name="slotStepMinutes"><option value="15">15 минут</option><option value="30" selected>30 минут</option><option value="60">60 минут</option></select></label>
          <label class="dashboard-checkbox-row"><input name="isClosed" type="checkbox"><span>Выходной</span></label>
        </div>
      </section>
      <div data-message></div>
      <button class="card-action dashboard-settings-submit" type="submit" ${list.length ? '' : 'disabled'}>Сохранить график</button>
    </form>
    <form class="dashboard-settings-form" data-block>
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Блокировки</p><h2>Недоступное время</h2></div></div>
        <div class="dashboard-settings-grid">
          <label><span>Мастер</span><select name="masterId" required>${masterOptions}</select></label>
          <label><span>Причина</span><input name="reason" placeholder="Перерыв" required></label>
          <label><span>Начало</span><input name="startsAt" required type="datetime-local"></label>
          <label><span>Конец</span><input name="endsAt" required type="datetime-local"></label>
        </div>
      </section>
      <div data-message></div>
      <button class="card-action dashboard-settings-submit" type="submit" ${list.length ? '' : 'disabled'}>Создать блокировку</button>
    </form>
    ${loadError ? `<p class="auth-error">${e(loadError)}</p>` : ''}
  </div>`;

  async function submit(formEl, action, success, fallback) {
    const slot = formEl.querySelector('[data-message]');
    slot.innerHTML = '';
    try {
      await action(new FormData(formEl));
      slot.innerHTML = `<p class="dashboard-settings-success">${success}</p>`;
    } catch (error) {
      slot.innerHTML = `<p class="auth-error">${e(errorText(error, fallback))}</p>`;
    }
  }
  // datetime-local values are salon wall-clock time; store them the same way bookings are stored.
  const wallToIso = value => new Date(`${value}:00.000Z`).toISOString();

  body.querySelector('[data-hours]').addEventListener('submit', event => {
    event.preventDefault();
    submit(event.target, form => api.saveWorkingHours(String(form.get('masterId')), { weekday: String(form.get('weekday') ?? 'MONDAY'), opensAt: String(form.get('opensAt') ?? ''), closesAt: String(form.get('closesAt') ?? ''), slotStepMinutes: Number(form.get('slotStepMinutes') ?? 30), isClosed: form.get('isClosed') === 'on' }), 'Рабочие часы сохранены', 'Не удалось сохранить рабочие часы');
  });
  body.querySelector('[data-block]').addEventListener('submit', event => {
    event.preventDefault();
    submit(event.target, form => api.createTimeBlock(String(form.get('masterId')), { startsAt: wallToIso(String(form.get('startsAt'))), endsAt: wallToIso(String(form.get('endsAt'))), reason: String(form.get('reason') ?? '') }), 'Блокировка создана', 'Не удалось создать блокировку');
  });
}

/* ---------- Settings ---------- */
async function settings(body, ctx) {
  body.innerHTML = '<section class="dashboard-panel"><p class="dashboard-settings-state">Загрузка профиля салона...</p></section>';
  const state = { salon: undefined, mode: 'edit', status: 'ready', message: undefined };
  try {
    state.salon = await api.getOwnSalonSettings();
  } catch (error) {
    if (error.code === 'SALON_NOT_FOUND') { state.mode = 'create'; state.message = 'Заполните данные салона, чтобы он появился в каталоге.'; }
    else { state.status = 'error'; state.message = errorText(error, 'Не удалось загрузить салон'); }
  }
  if (!ctx.alive()) return;

  function render() {
    const salon = state.salon;
    const coordinates = salon?.coordinates ?? { lat: 53.3481, lng: 83.7798 };
    const create = state.mode === 'create';
    body.innerHTML = `<form class="dashboard-settings-form">
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">${create ? 'Новый салон' : 'Профиль'}</p><h2>${create ? 'Добавить салон' : 'Основные данные'}</h2></div></div>
        <div class="dashboard-settings-grid">
          <label><span>Название</span><input name="name" placeholder="Салон на Молодёжной" required value="${e(salon?.name ?? '')}"></label>
          <label><span>Район</span><input name="area" placeholder="Центральный район" required value="${e(salon?.area ?? '')}"></label>
          <label><span>Телефон</span><input name="phone" placeholder="+7 (3852) 44-18-22" required value="${e(salon?.phone ?? '')}"></label>
          <label><span>Фото салона</span><input accept="image/jpeg,image/png,image/webp" name="imageFile" type="file"></label>
          <label><span>Фото URL</span><input name="imageUrl" placeholder="https://..." type="url" value="${/^https?:/.test(salon?.imageUrl ?? '') ? e(salon.imageUrl) : ''}"></label>
          <label><span>Адрес</span><input name="address" placeholder="ул. Молодёжная, 12" required value="${e(salon?.address ?? '')}"></label>
          <label class="dashboard-settings-wide"><span>Описание</span><textarea name="description" placeholder="Опишите специализацию салона и преимущества для клиентов" required rows="5">${e(salon?.description ?? '')}</textarea></label>
        </div>
      </section>
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading"><div><p class="section-kicker">Карта</p><h2>Координаты</h2></div></div>
        <div class="dashboard-settings-grid">
          <label><span>Широта</span><input inputmode="decimal" name="lat" required step="0.000001" type="number" value="${coordinates.lat}"></label>
          <label><span>Долгота</span><input inputmode="decimal" name="lng" required step="0.000001" type="number" value="${coordinates.lng}"></label>
        </div>
      </section>
      ${messageMarkup(state.status, state.message)}
      <button class="card-action dashboard-settings-submit" type="submit" ${state.status === 'saving' ? 'disabled' : ''}>${state.status === 'saving' ? 'Сохранение...' : create ? 'Создать салон' : 'Сохранить изменения'}</button>
    </form>`;
  }

  body.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.target);
    let input;
    try {
      input = { name: String(form.get('name') ?? '').trim(), description: String(form.get('description') ?? '').trim(), area: String(form.get('area') ?? '').trim(), address: String(form.get('address') ?? '').trim(), phone: String(form.get('phone') ?? '').trim(), imageUrl: (await readImageFile(form, 'imageFile')) ?? (String(form.get('imageUrl') ?? '').trim() || undefined), coordinates: { lat: readNumber(form, 'lat'), lng: readNumber(form, 'lng') } };
    } catch (error) {
      state.status = 'error';
      state.message = error.message;
      render();
      return;
    }
    const wasCreate = state.mode === 'create';
    state.status = 'saving';
    state.message = undefined;
    render();
    try {
      state.salon = wasCreate ? await api.createOwnSalonSettings(input) : await api.updateOwnSalonSettings(input);
      state.mode = 'edit';
      state.status = 'saved';
      state.message = wasCreate ? 'Салон создан' : 'Профиль салона обновлён';
    } catch (error) {
      state.status = 'error';
      state.message = errorText(error, 'Не удалось сохранить салон');
    }
    if (ctx.alive()) render();
  });

  render();
}
