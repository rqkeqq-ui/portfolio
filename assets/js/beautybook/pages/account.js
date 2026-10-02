// app/account/page.tsx: AccountGuard, ProfileForm, MyBookingsList and ReviewForm.
import { cancelClientBooking, createReview, getClientProfile, listClientBookings } from '../api.js';
import { getStoredSession } from '../session.js';
import { e, errorText, formatUtc, href } from '../ui.js';
import { guardPage } from './states.js';

const statusLabels = { PENDING: 'Ожидает подтверждения', CONFIRMED: 'Подтверждена', CANCELLED: 'Отменена', COMPLETED: 'Завершена' };
const formatDateTime = value => formatUtc(value, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const checkIcon = '<svg aria-hidden="true" fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24" width="18"><polyline points="20 6 9 17 4 12"/></svg>';

function redirectFor(role) {
  if (!role) return '/login';
  if (role === 'CLIENT') return undefined;
  if (role === 'SALON_OWNER') return '/dashboard';
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return '/admin';
  return '/search';
}

function reviewForm(booking) {
  if (booking.hasReview) return `<div class="review-form-sent">${checkIcon}Отзыв отправлен — спасибо!</div>`;
  return `<div class="review-form" data-review="${booking.id}" data-rating="5">
    ${booking.status === 'CONFIRMED' ? '<p class="review-form-note">Предварительный отзыв — услуга ещё не завершена.</p>' : ''}
    <div class="review-form-rating-row"><span class="review-form-field-label">Оценка</span>
      <div class="star-picker" role="radiogroup" aria-label="Оценка">
        ${[1, 2, 3, 4, 5].map(star => `<button aria-label="${star} из 5" class="star-picker-btn star-picker-btn--on" data-star="${star}" type="button">★</button>`).join('')}
        <span class="star-picker-value">5.0</span>
      </div>
    </div>
    <label class="review-form-text-wrap"><span class="review-form-field-label">Комментарий</span><textarea placeholder="Расскажите о своём визите..." rows="3"></textarea></label>
    <button class="review-form-submit" disabled data-submit-review type="button">Оставить отзыв</button>
  </div>`;
}

function bookingGroup(title, emptyText, bookings, canCancel) {
  return `<div class="account-booking-group">
    <h3>${title}</h3>
    ${bookings.length ? '' : `<p class="account-muted">${emptyText}</p>`}
    <div class="account-booking-list">${bookings.map(booking => {
      const reviewable = booking.status === 'CONFIRMED' || booking.status === 'COMPLETED';
      return `<article class="account-booking-card">
        <div class="account-booking-main">
          <span data-status="${booking.status}">${statusLabels[booking.status]}</span>
          <h4>${e(booking.service?.name ?? 'Услуга')}</h4>
          <p>${booking.salon ? `<a href="${href(`/salons/${booking.salon.slug}`)}">${e(booking.salon.name)}</a>` : 'Салон'} · ${e(booking.master?.name ?? 'Мастер')}</p>
        </div>
        <dl>
          <div><dt>Время</dt><dd>${formatDateTime(booking.startsAt)}</dd></div>
          <div><dt>Адрес</dt><dd>${e(booking.salon?.address ?? 'Адрес уточняется')}</dd></div>
          <div><dt>Стоимость</dt><dd>${Math.round(booking.totalPriceCents / 100).toLocaleString('ru-RU')} ₽</dd></div>
        </dl>
        ${canCancel || reviewable ? `<div class="account-booking-actions">
          ${canCancel ? `<button data-cancel="${booking.id}" type="button">Отменить запись</button>` : ''}
          ${reviewable ? reviewForm(booking) : ''}
        </div>` : ''}
      </article>`;
    }).join('')}</div>
  </div>`;
}

export async function accountPage(ctx) {
  const redirect = redirectFor(getStoredSession()?.user.role);
  if (redirect) {
    guardPage(ctx, { kicker: 'Личный кабинет', title: redirect === '/login' ? 'Нужен вход' : 'Открываем подходящий кабинет', text: redirect === '/login' ? 'Войдите как клиент, чтобы посмотреть профиль и записи.' : 'Для вашей роли доступен другой раздел платформы.', link: redirect });
    if (redirect !== '/login') ctx.navigate(redirect, { replace: true });
    return;
  }
  ctx.setTitle('Личный кабинет | BeautyBook');
  const page = ctx.mount(`
    <main class="account-page">
      <section class="account-hero"><p class="section-kicker">Личный кабинет</p><h1>Профиль и записи</h1><p>Проверьте данные аккаунта, посмотрите ближайшие визиты и отмените запись при необходимости.</p></section>
      <div class="account-layout"><p class="account-muted" data-profile>Загрузка профиля...</p><p class="account-muted" data-bookings>Загрузка записей...</p></div>
    </main>`);

  getClientProfile().then(profile => {
    if (!ctx.alive()) return;
    page.querySelector('[data-profile]').outerHTML = `<section class="account-panel account-profile-panel" aria-labelledby="account-profile-title">
      <div><p class="section-kicker">Профиль</p><h2 id="account-profile-title">Данные клиента</h2></div>
      <dl class="account-definition-list"><div><dt>Имя</dt><dd>${e(profile.name)}</dd></div><div><dt>Email</dt><dd>${e(profile.email)}</dd></div><div><dt>Телефон</dt><dd>${e(profile.phone ?? 'Не указан')}</dd></div></dl>
    </section>`;
  }).catch(error => {
    if (ctx.alive()) page.querySelector('[data-profile]').outerHTML = `<p class="auth-error">${e(errorText(error, 'Не удалось загрузить профиль'))}</p>`;
  });

  let bookings = [];
  let bookingsError;
  const slot = page.querySelector('[data-bookings]');
  let panel = slot;

  function renderBookings() {
    // Booking times are salon wall-clock values stored as UTC, so compare against local time expressed the same way.
    const local = new Date();
    const nowWall = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes());
    const isUpcoming = booking => booking.status === 'CONFIRMED' && new Date(booking.startsAt).getTime() >= nowWall;
    const markup = `<section class="account-panel account-bookings-panel" aria-labelledby="account-bookings-title">
      <div class="account-panel-header"><div><p class="section-kicker">Записи</p><h2 id="account-bookings-title">Мои записи</h2></div><a class="card-action" href="${href('/search')}">Найти салон</a></div>
      ${bookingsError ? `<p class="auth-error">${e(bookingsError)}</p>` : ''}
      ${bookingGroup('Ближайшие записи', 'Ближайших записей пока нет.', bookings.filter(isUpcoming), true)}
      ${bookingGroup('История', 'История появится после завершения или отмены записи.', bookings.filter(booking => !isUpcoming(booking)), false)}
    </section>`;
    panel.outerHTML = markup;
    panel = page.querySelector('.account-bookings-panel');
  }

  try {
    bookings = await listClientBookings();
  } catch (error) {
    bookingsError = errorText(error, 'Не удалось загрузить записи');
  }
  if (!ctx.alive()) return;
  renderBookings();

  page.addEventListener('click', async event => {
    const cancel = event.target.closest('[data-cancel]');
    if (cancel) {
      cancel.disabled = true;
      cancel.textContent = 'Отменяем...';
      bookingsError = undefined;
      try {
        const updated = await cancelClientBooking(cancel.dataset.cancel);
        bookings = bookings.map(booking => (booking.id === updated.id ? updated : booking));
      } catch (error) {
        bookingsError = errorText(error, 'Не удалось отменить запись');
      }
      if (ctx.alive()) renderBookings();
      return;
    }

    const form = event.target.closest('[data-review]');
    if (!form) return;
    const star = event.target.closest('[data-star]');
    if (star) {
      form.dataset.rating = star.dataset.star;
      paintStars(form, Number(star.dataset.star));
      form.querySelector('.star-picker-value').textContent = `${star.dataset.star}.0`;
    }
    if (event.target.closest('[data-submit-review]')) {
      const button = event.target.closest('[data-submit-review]');
      const text = form.querySelector('textarea').value;
      if (!text.trim()) return;
      button.disabled = true;
      button.textContent = 'Отправка...';
      form.querySelector('.review-form-error')?.remove();
      try {
        await createReview({ bookingId: form.dataset.review, rating: Number(form.dataset.rating), text });
        bookings = bookings.map(booking => (booking.id === form.dataset.review ? { ...booking, hasReview: true } : booking));
        form.outerHTML = `<div class="review-form-sent">${checkIcon}Отзыв отправлен — спасибо!</div>`;
      } catch (error) {
        button.insertAdjacentHTML('beforebegin', `<p class="review-form-error">${e(errorText(error, 'Не удалось отправить отзыв'))}</p>`);
        button.disabled = false;
        button.textContent = 'Оставить отзыв';
      }
    }
  });

  function paintStars(form, active) {
    form.querySelectorAll('[data-star]').forEach(button => button.classList.toggle('star-picker-btn--on', active >= Number(button.dataset.star)));
  }
  page.addEventListener('mouseover', event => {
    const star = event.target.closest('[data-review] [data-star]');
    if (star) paintStars(star.closest('[data-review]'), Number(star.dataset.star));
  });
  page.addEventListener('mouseout', event => {
    const star = event.target.closest('[data-review] [data-star]');
    if (star) { const form = star.closest('[data-review]'); paintStars(form, Number(form.dataset.rating)); }
  });
  page.addEventListener('input', event => {
    const form = event.target.closest('[data-review]');
    if (form && event.target.matches('textarea')) form.querySelector('[data-submit-review]').disabled = !event.target.value.trim();
  });
}
