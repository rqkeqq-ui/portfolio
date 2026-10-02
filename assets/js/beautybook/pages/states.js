// app/loading.tsx, app/not-found.tsx and the guard screens shared by the cabinets.
import { e, href } from '../ui.js';

export const loadingMarkup = `<main class="state-page" aria-live="polite"><div class="loading-mark"></div><h1>Загружаем страницу</h1><p>Собираем интерфейс и данные для следующего шага бронирования.</p></main>`;

export function notFoundPage(ctx) {
  ctx.setTitle('Страница не найдена | BeautyBook');
  ctx.mount(`<main class="state-page"><p class="section-kicker">404</p><h1>Страница не найдена</h1><p>Возможно, этот раздел появится на одном из следующих этапов roadmap или адрес был введён с ошибкой.</p><a class="state-action" href="${href('/')}">Вернуться на главную</a></main>`);
}

export function errorPage(ctx, error, retry) {
  const page = ctx.mount(`<main class="state-page"><p class="section-kicker">Ошибка</p><h1>Что-то пошло не так</h1><p>${e(error?.message || 'Не удалось открыть раздел. Попробуйте обновить страницу.')}</p><button class="state-action" type="button">Повторить</button></main>`);
  page.querySelector('button').addEventListener('click', retry);
}

export function guardPage(ctx, { kicker, title, text, link, linkClass = 'card-action' }) {
  ctx.mount(`<main class="dashboard-guard"><p class="section-kicker">${kicker}</p><h1>${title}</h1>${text ? `<p>${text}</p>` : ''}${link ? `<a class="${linkClass}" href="${href(link)}">${link === '/login' ? 'Войти' : 'Перейти'}</a>` : ''}</main>`);
}
