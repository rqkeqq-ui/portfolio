// app/booking/[salonId]/page.tsx with BookingWizard, ServiceStep, MasterStep, DateTimeStep and BookingSummary.
import { createBooking, getAvailabilitySlots, getSalonById } from '../api.js';
import { getStoredSession } from '../session.js';
import { e, errorText, formatUtc, href, img, ratingStars } from '../ui.js';
import { notFoundPage } from './states.js';

const steps = [{ id: 'service', label: 'Услуга' }, { id: 'master', label: 'Мастер' }, { id: 'datetime', label: 'Дата и время' }];

function getBookableDates(base = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);
    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { id, label: new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(date) };
  });
}

function canContinue(step, draft) {
  if (step === 'service') return Boolean(draft.serviceId);
  if (step === 'master') return Boolean(draft.serviceId && draft.masterId);
  return Boolean(draft.serviceId && draft.masterId && draft.date && draft.slotId);
}

function getSummary(salon, draft) {
  if (!draft.serviceId || !draft.masterId || !draft.date || !draft.slotId) return undefined;
  const service = salon.salonServices.find(item => item.id === draft.serviceId);
  const master = salon.masters.find(item => item.id === draft.masterId);
  if (!service || !master) return undefined;
  return { serviceId: service.id, masterId: master.id, salonName: salon.name, serviceName: service.name, masterName: master.name, date: draft.date, slotId: draft.slotId, startsAt: draft.slotStartsAt, endsAt: draft.slotEndsAt, price: service.price, durationMinutes: service.durationMinutes };
}

const formatDate = date => new Intl.DateTimeFormat('ru-RU').format(new Date(`${date}T00:00:00`));
const formatTime = value => formatUtc(value, { hour: '2-digit', minute: '2-digit' });

function summaryPanel(summary, booking) {
  if (booking && summary) {
    return `<aside class="booking-summary booking-success" aria-live="polite">
      <p class="section-kicker">Запись подтверждена</p><h2>Бронь создана</h2>
      <p>Номер записи: <strong>${e(booking.id.slice(0, 8))}</strong>.</p>
      <dl><div><dt>Салон</dt><dd>${e(summary.salonName)}</dd></div><div><dt>Услуга</dt><dd>${e(summary.serviceName)}</dd></div><div><dt>Мастер</dt><dd>${e(summary.masterName)}</dd></div><div><dt>Время</dt><dd>${formatDate(summary.date)}, ${formatTime(booking.startsAt)}</dd></div></dl>
      <a class="card-action" href="${href('/account')}">В личный кабинет</a>
    </aside>`;
  }
  return `<aside class="booking-summary">
    <p class="section-kicker">Итог</p><h2>Детали записи</h2>
    ${summary ? `<dl><div><dt>Салон</dt><dd>${e(summary.salonName)}</dd></div><div><dt>Услуга</dt><dd>${e(summary.serviceName)}</dd></div><div><dt>Мастер</dt><dd>${e(summary.masterName)}</dd></div><div><dt>Дата</dt><dd>${formatDate(summary.date)}</dd></div><div><dt>Слот</dt><dd>${formatTime(summary.startsAt)}-${formatTime(summary.endsAt)}</dd></div></dl>
      <div class="booking-total"><span>${summary.durationMinutes} мин</span><strong>${summary.price.toLocaleString('ru-RU')} ₽</strong></div>`
    : '<p class="booking-step-note">Выберите услугу, мастера и время, чтобы увидеть итог.</p>'}
  </aside>`;
}

export async function bookingPage(ctx) {
  const salon = await getSalonById(ctx.params[0]);
  if (!ctx.alive()) return;
  if (!salon) { notFoundPage(ctx); return; }
  ctx.setTitle(`Запись в ${salon.name}`);

  const selectedServiceId = ctx.query.get('service') || undefined;
  const state = {
    step: 'service', draft: selectedServiceId ? { serviceId: selectedServiceId } : {}, comment: '', phone: '',
    booking: undefined, submitting: false, error: undefined, slots: [], slotsLoading: false, slotsError: undefined
  };
  const dates = getBookableDates();

  const page = ctx.mount(`
    <main class="booking-page">
      <section class="booking-hero">
        <div><h1>${e(salon.name)}</h1><p>Выберите услугу, мастера и свободное время. После подтверждения запись появится в личном кабинете.</p></div>
        <div class="booking-hero-meta">${ratingStars(salon.rating, salon.reviewCount)}<span>${e(salon.address)}</span></div>
      </section>
      <div class="booking-wizard"></div>
    </main>`);
  const wizard = page.querySelector('.booking-wizard');

  const session = () => getStoredSession();
  const customerPhone = () => session()?.user.phone?.trim() || state.phone.trim();
  const confirmDisabled = summary => !summary || !session() || !customerPhone() || state.submitting || Boolean(state.booking);

  function stepBody() {
    const { draft } = state;
    if (state.step === 'service') {
      return `<section class="booking-step-panel" aria-labelledby="booking-service-title">
        <div class="booking-step-heading"><p class="section-kicker">Шаг 1</p><h2 id="booking-service-title">Выберите услугу</h2></div>
        <div class="booking-option-grid">${salon.salonServices.map(service => `<button class="booking-option" data-selected="${draft.serviceId === service.id}" data-service="${service.id}" type="button">
          <span>${e(service.categoryLabel)}</span><strong>${e(service.name)}</strong><small>${e(service.description)}</small><b>${service.price.toLocaleString('ru-RU')} ₽ · ${service.durationMinutes} мин</b>
        </button>`).join('')}</div>
      </section>`;
    }
    if (state.step === 'master') {
      const masters = draft.serviceId ? salon.masters.filter(master => master.serviceIds.includes(draft.serviceId)) : [];
      return `<section class="booking-step-panel" aria-labelledby="booking-master-title">
        <div class="booking-step-heading"><p class="section-kicker">Шаг 2</p><h2 id="booking-master-title">Выберите мастера</h2></div>
        ${masters.length ? `<div class="booking-master-list">${masters.map(master => `<button class="booking-master-option" data-selected="${draft.masterId === master.id}" data-master="${master.id}" type="button">
          <img src="${img(master.imageUrl)}" alt="Мастер ${e(master.name)}">
          <div class="booking-master-info"><strong>${e(master.name)}</strong><small>${e(master.role)} · ${master.experienceYears} лет опыта</small>${ratingStars(master.rating)}</div>
        </button>`).join('')}</div>` : '<p class="booking-step-note">Сначала выберите услугу, чтобы увидеть подходящих мастеров.</p>'}
      </section>`;
    }
    const activeDate = draft.date ?? dates[0].id;
    return `<section class="booking-step-panel" aria-labelledby="booking-time-title">
      <div class="booking-step-heading"><p class="section-kicker">Шаг 3</p><h2 id="booking-time-title">Выберите дату и время</h2></div>
      ${!draft.serviceId || !draft.masterId ? '<p class="booking-step-note">Сначала выберите услугу и мастера, затем появятся свободные окна.</p>' : `
        <div class="booking-date-row" aria-label="Даты записи">${dates.map(date => `<button data-selected="${activeDate === date.id}" data-date="${date.id}" type="button">${date.label}</button>`).join('')}</div>
        <div class="booking-slot-grid" aria-label="Свободное время">
          ${state.slotsLoading ? '<p class="booking-step-note">Загрузка свободных слотов...</p>' : ''}
          ${state.slotsError ? `<p class="auth-error">${e(state.slotsError)}</p>` : ''}
          ${!state.slotsLoading && !state.slotsError && !state.slots.length ? '<p class="booking-step-note">На выбранную дату свободных слотов нет.</p>' : ''}
          ${state.slotsLoading ? '' : state.slots.map(slot => `<button data-selected="${draft.slotId === slot.id}" data-slot="${slot.id}" type="button">${slot.label}</button>`).join('')}
        </div>`}
    </section>`;
  }

  function finalPanel(summary) {
    if (state.step !== 'datetime' || !summary) return '';
    const current = session();
    return `<section class="booking-step-panel booking-final-panel">
      <p class="section-kicker">Подтверждение</p>
      ${current ? `
        ${current.user.phone ? `<p class="booking-step-note">Телефон для записи: ${e(current.user.phone)}</p>` : `<label class="booking-inline-field">Телефон<input data-field="phone" placeholder="+7 900 000-00-00" type="tel" value="${e(state.phone)}"></label>`}
        <label class="booking-inline-field">Комментарий<textarea data-field="comment" placeholder="Пожелания к визиту" rows="3">${e(state.comment)}</textarea></label>
        ${state.error ? `<p class="auth-error">${e(state.error)}</p>` : ''}`
      : `<div class="booking-auth-gate"><p>Войдите или создайте клиентский аккаунт, чтобы подтвердить запись.</p><div><a class="card-action" href="${href(`/login?next=${encodeURIComponent(`/booking/${salon.id}`)}`)}">Войти</a><a class="map-focus-action" href="${href('/register')}">Регистрация</a></div></div>`}
    </section>`;
  }

  function render() {
    const index = steps.findIndex(step => step.id === state.step);
    const summary = getSummary(salon, state.draft);
    wizard.innerHTML = `
      <section class="booking-main">
        <nav class="booking-progress" aria-label="Шаги бронирования">
          ${steps.map((step, i) => `<button data-active="${step.id === state.step}" data-complete="${i < index}" ${i > index ? 'disabled' : ''} data-step="${step.id}" type="button"><span>${i + 1}</span>${step.label}</button>`).join('')}
        </nav>
        ${stepBody()}
        ${finalPanel(summary)}
        <div class="booking-controls">
          <button ${index === 0 ? 'disabled' : ''} data-back type="button">Назад</button>
          ${state.step === 'datetime'
            ? `<button class="card-action" ${confirmDisabled(summary) ? 'disabled' : ''} data-confirm type="button">${state.submitting ? 'Создание записи...' : 'Подтвердить запись'}</button>`
            : `<button class="card-action" ${canContinue(state.step, state.draft) ? '' : 'disabled'} data-next type="button">Далее</button>`}
        </div>
      </section>
      ${summaryPanel(summary, state.booking)}`;
  }

  async function loadSlots() {
    const { draft } = state;
    if (!draft.serviceId || !draft.masterId) { state.slots = []; render(); return; }
    const date = draft.date ?? dates[0].id;
    state.slotsLoading = true;
    state.slotsError = undefined;
    render();
    try {
      const slots = await getAvailabilitySlots({ serviceId: draft.serviceId, masterId: draft.masterId, date });
      if ((state.draft.date ?? dates[0].id) !== date) return;
      state.slots = slots;
    } catch (error) {
      state.slots = [];
      state.slotsError = errorText(error, 'Не удалось загрузить свободное время');
    } finally {
      state.slotsLoading = false;
      if (ctx.alive()) render();
    }
  }

  function updateDraft(next) {
    state.draft = next;
    state.booking = undefined;
    state.error = undefined;
  }

  function goTo(step) {
    state.step = step;
    if (step === 'datetime') loadSlots(); else render();
  }

  wizard.addEventListener('click', async event => {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.dataset.step) goTo(target.dataset.step);
    else if (target.dataset.service) { updateDraft({ serviceId: target.dataset.service }); render(); }
    else if (target.dataset.master) { updateDraft({ ...state.draft, masterId: target.dataset.master, date: undefined, slotId: undefined, slotStartsAt: undefined, slotEndsAt: undefined }); render(); }
    else if (target.dataset.date) { updateDraft({ ...state.draft, date: target.dataset.date, slotId: undefined, slotStartsAt: undefined, slotEndsAt: undefined }); loadSlots(); }
    else if (target.dataset.slot) {
      const slot = state.slots.find(item => item.id === target.dataset.slot);
      updateDraft({ ...state.draft, date: state.draft.date ?? slot.date, slotId: slot.id, slotStartsAt: slot.startsAt, slotEndsAt: slot.endsAt });
      render();
    } else if ('back' in target.dataset) { const i = steps.findIndex(step => step.id === state.step); if (i > 0) goTo(steps[i - 1].id); }
    else if ('next' in target.dataset) { const i = steps.findIndex(step => step.id === state.step); if (canContinue(state.step, state.draft)) goTo(steps[i + 1].id); }
    else if ('confirm' in target.dataset) {
      const summary = getSummary(salon, state.draft);
      const current = session();
      if (!summary || !current || !customerPhone()) return;
      state.submitting = true;
      state.error = undefined;
      render();
      try {
        state.booking = await createBooking({ masterId: summary.masterId, serviceId: summary.serviceId, startsAt: summary.startsAt, customerName: current.user.name, customerPhone: customerPhone(), customerComment: state.comment });
      } catch (error) {
        state.error = errorText(error, 'Не удалось создать запись');
      } finally {
        state.submitting = false;
        if (ctx.alive()) render();
      }
    }
  });

  wizard.addEventListener('input', event => {
    const field = event.target.dataset.field;
    if (!field) return;
    state[field] = event.target.value;
    const confirm = wizard.querySelector('[data-confirm]');
    if (confirm) confirm.disabled = confirmDisabled(getSummary(salon, state.draft));
  });

  render();
}
