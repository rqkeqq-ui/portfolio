// app/login, app/register and app/register-salon with their forms.
import { login, loginAsDemo, registerClient, registerSalonOwner } from '../api.js';
import { getCabinetHref } from '../session.js';
import { e, errorText, href } from '../ui.js';

const russianNamePattern = '^[А-ЯЁа-яё]+(?:[ -][А-ЯЁа-яё]+)*$';
const russianNameError = 'Укажите имя кириллицей, например Иван Иванов.';
const isRussianName = value => value.trim().length >= 2 && new RegExp(russianNamePattern, 'u').test(value.trim());

function authShell(ctx, { kicker, id, title, text, form }) {
  return ctx.mount(`
    <main class="auth-page">
      <section class="auth-panel" aria-labelledby="${id}">
        <div class="auth-copy"><p class="section-kicker">${kicker}</p><h1 id="${id}">${title}</h1><p>${text}</p></div>
        ${form}
      </section>
    </main>`);
}

function bindForm(page, { submitLabel, busyLabel, validate, submit }) {
  const form = page.querySelector('.auth-form');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    form.querySelector('.auth-error')?.remove();
    const data = new FormData(form);
    const showError = message => button.insertAdjacentHTML('beforebegin', `<p class="auth-error">${e(message)}</p>`);
    const invalid = validate?.(data);
    if (invalid) { showError(invalid); return; }
    button.disabled = true;
    button.textContent = busyLabel;
    try {
      await submit(data);
    } catch (error) {
      showError(errorText(error, 'Не удалось выполнить действие'));
    } finally {
      button.disabled = false;
      button.textContent = submitLabel;
    }
  });
}

// Portfolio addition: one-click access to the seeded demo accounts (password Demo12345!).
const demoAccess = `
  <div class="auth-demo">
    <p>Демо-доступ: пароль <b>Demo12345!</b></p>
    <div>
      <button type="button" data-demo="CLIENT">Клиент</button>
      <button type="button" data-demo="SALON_OWNER">Владелец салона</button>
      <button type="button" data-demo="SUPER_ADMIN">Администратор</button>
    </div>
  </div>`;

export function loginPage(ctx) {
  ctx.setTitle('Вход | BeautyBook');
  const next = ctx.query.get('next');
  const after = session => ctx.navigate(next && session.user.role === 'CLIENT' ? next : getCabinetHref(session.user.role));
  const page = authShell(ctx, {
    kicker: 'Вход', id: 'login-title', title: 'Войдите в свой кабинет',
    text: 'Клиенты управляют записями, владельцы салонов настраивают профиль, услуги, мастеров и расписание.',
    form: `<form class="auth-form">
      <label><span>Email</span><input autocomplete="email" name="email" placeholder="ivan@example.com" required type="email"></label>
      <label><span>Пароль</span><input autocomplete="current-password" minlength="8" name="password" required type="password"></label>
      <button class="card-action" type="submit">Войти</button>
      <p class="auth-form-note">Нет аккаунта? <a href="${href('/register')}">Зарегистрируйтесь</a></p>
      ${demoAccess}
    </form>`
  });
  bindForm(page, {
    submitLabel: 'Войти', busyLabel: 'Вход...',
    submit: async data => after(await login({ email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') }))
  });
  page.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', async () => after(await loginAsDemo(button.dataset.demo))));
}

export function registerPage(ctx) {
  ctx.setTitle('Регистрация клиента | BeautyBook');
  const page = authShell(ctx, {
    kicker: 'Регистрация', id: 'register-title', title: 'Создайте клиентский аккаунт',
    text: 'Аккаунт нужен для записи в салон, просмотра ближайших визитов и управления бронированиями.',
    form: `<form class="auth-form">
      <label><span>Имя</span><input autocomplete="name" name="name" pattern="${russianNamePattern}" placeholder="Иван Иванов" required title="${russianNameError}" type="text"></label>
      <label><span>Email</span><input autocomplete="email" name="email" placeholder="ivan@example.com" required type="email"></label>
      <label><span>Телефон</span><input autocomplete="tel" name="phone" placeholder="+7 900 000-00-00" required type="tel"></label>
      <label><span>Пароль</span><input autocomplete="new-password" minlength="8" name="password" required type="password"></label>
      <button class="card-action" type="submit">Создать аккаунт</button>
      <p class="auth-form-note">Уже есть аккаунт? <a href="${href('/login')}">Войдите</a></p>
    </form>`
  });
  bindForm(page, {
    submitLabel: 'Создать аккаунт', busyLabel: 'Создание...',
    validate: data => (isRussianName(String(data.get('name') ?? '')) ? undefined : russianNameError),
    submit: async data => {
      await registerClient({ name: String(data.get('name')).trim(), phone: String(data.get('phone') ?? ''), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') });
      ctx.navigate('/account');
    }
  });
}

export function registerSalonPage(ctx) {
  ctx.setTitle('Подключить салон | BeautyBook');
  const page = authShell(ctx, {
    kicker: 'Для салонов', id: 'register-salon-title', title: 'Создайте кабинет салона',
    text: 'После регистрации добавьте карточку салона, услуги, мастеров и расписание для онлайн-записи.',
    form: `<form class="auth-form">
      <label><span>Имя администратора</span><input autocomplete="name" name="name" pattern="${russianNamePattern}" placeholder="Мария Иванова" required title="${russianNameError}" type="text"></label>
      <label><span>Рабочий email</span><input autocomplete="email" name="email" placeholder="owner@example.com" required type="email"></label>
      <label><span>Пароль</span><input autocomplete="new-password" minlength="8" name="password" required type="password"></label>
      <button class="card-action" type="submit">Создать кабинет салона</button>
      <p class="auth-form-note">Нужен клиентский аккаунт? <a href="${href('/register')}">Регистрация клиента</a></p>
    </form>`
  });
  bindForm(page, {
    submitLabel: 'Создать кабинет салона', busyLabel: 'Создание...',
    validate: data => (isRussianName(String(data.get('name') ?? '')) ? undefined : russianNameError),
    submit: async data => {
      await registerSalonOwner({ name: String(data.get('name')).trim(), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') });
      ctx.navigate('/dashboard/settings');
    }
  });
}
