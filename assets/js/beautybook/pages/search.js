// app/search/page.tsx with SearchClient, SearchFilters, SalonMap and SearchResults.
import { getSalons } from '../api.js';
import { e, href, img, ratingStars, serviceCategoryLabels } from '../ui.js';

const BARNAUL_CENTER = { lat: 53.3481, lng: 83.7798 };

function readNumber(query, key) {
  const raw = query.get(key);
  const value = raw ? Number(raw) : undefined;
  return Number.isFinite(value) ? value : undefined;
}

function parseFilters(query) {
  const sortBy = query.get('sortBy');
  return {
    query: query.get('q') ?? query.get('service') ?? query.get('location') ?? undefined,
    category: query.get('category') ?? 'all',
    minPrice: readNumber(query, 'minPrice'),
    maxPrice: readNumber(query, 'maxPrice'),
    minRating: readNumber(query, 'minRating'),
    sortBy: sortBy && sortBy !== 'distance' ? sortBy : 'rating'
  };
}

function createSearchUrl(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== 'all') params.set(key === 'query' ? 'q' : key, String(value));
  }
  return `/search${params.toString() ? `?${params}` : ''}`;
}

function mapUrl(salons) {
  const params = new URLSearchParams({ ll: `${BARNAUL_CENTER.lng},${BARNAUL_CENTER.lat}`, z: '12' });
  const points = salons.map(salon => `${salon.coordinates.lng},${salon.coordinates.lat},pm2rdm`).join('~');
  if (points) params.set('pt', points);
  return `https://yandex.ru/map-widget/v1/?${params}`;
}

const salonCard = salon => `
  <article class="search-card">
    <a class="search-card-image-link" href="${href(`/salons/${salon.id}`)}" aria-label="Открыть страницу ${e(salon.name)}"><img src="${img(salon.imageUrl)}" alt="Фото салона ${e(salon.name)}"></a>
    <div class="search-card-body">
      <div class="search-card-topline"><span>${e(salon.area)}</span></div>
      <h2><a href="${href(`/salons/${salon.id}`)}">${e(salon.name)}</a></h2>
      <div class="service-tags">${salon.categories.map(category => `<span>${serviceCategoryLabels[category] ?? e(category)}</span>`).join('')}</div>
      <ul class="service-list">${salon.services.slice(0, 3).map(service => `<li>${e(service)}</li>`).join('')}</ul>
      <div class="search-card-footer">${ratingStars(salon.rating, salon.reviewCount)}<div class="search-card-price"><strong>от ${salon.startingPrice.toLocaleString('ru-RU')} ₽</strong></div></div>
      <div class="search-card-actions"><a class="card-action" href="${href(`/salons/${salon.id}`)}">Подробнее</a></div>
    </div>
  </article>`;

function explorer(salons) {
  const map = salons.length
    ? `<section class="search-map" aria-label="Карта салонов"><iframe class="yandex-map" src="${mapUrl(salons)}" title="Салоны на Яндекс Картах" loading="lazy"></iframe></section>`
    : '<section class="search-map map-empty" aria-label="Карта салонов"><p>На карте появятся салоны, когда фильтры найдут подходящие варианты.</p></section>';
  const results = salons.length
    ? `<section class="results-list" aria-label="Список салонов">${salons.map(salonCard).join('')}</section>`
    : `<section class="empty-results"><p class="section-kicker">Ничего не найдено</p><h2>Попробуйте расширить фильтры</h2><p>Уменьшите минимальный рейтинг или уберите ограничение по цене.</p><a class="state-action" href="${href('/search')}">Сбросить фильтры</a></section>`;
  return `<div class="search-explorer"><div class="search-explorer-grid">${map}${results}</div></div>`;
}

function filtersPanel(filters) {
  const categoryOptions = [['all', 'Все услуги'], ...Object.entries(serviceCategoryLabels)];
  const option = (value, label, selected) => `<option value="${value}" ${String(selected) === String(value) ? 'selected' : ''}>${label}</option>`;
  return `
    <aside class="search-filters" aria-label="Фильтры поиска">
      <form class="filters-form">
        <label><span>Поиск</span><input name="q" placeholder="Стрижка, маникюр, салон" value="${e(filters.query ?? '')}"></label>
        <label><span>Категория</span><select name="category">${categoryOptions.map(([value, label]) => option(value, label, filters.category ?? 'all')).join('')}</select></label>
        <div class="filter-row">
          <label><span>Цена от</span><input name="minPrice" type="number" min="0" step="100" value="${filters.minPrice ?? ''}"></label>
          <label><span>Цена до</span><input name="maxPrice" type="number" min="0" step="100" value="${filters.maxPrice ?? ''}"></label>
        </div>
        <label><span>Рейтинг от</span><select name="minRating">${[['', 'Любой'], ['4.0', '4.0'], ['4.5', '4.5'], ['4.8', '4.8'], ['4.9', '4.9']].map(([value, label]) => option(value, label, filters.minRating === undefined ? '' : filters.minRating.toFixed(1))).join('')}</select></label>
        <label><span>Сортировка</span><select name="sortBy">${option('rating', 'Сначала выше рейтинг', filters.sortBy)}${option('price', 'Сначала дешевле', filters.sortBy)}</select></label>
        <div class="filter-actions">
          <button class="filter-submit" type="submit">Показать</button>
          <button class="map-focus-action" type="button" data-reset>Сбросить</button>
        </div>
      </form>
    </aside>`;
}

export async function searchPage(ctx) {
  let filters = parseFilters(ctx.query);
  let salons = await getSalons(filters);
  if (!ctx.alive()) return;
  ctx.setTitle('Каталог салонов | BeautyBook');
  const page = ctx.mount(`
    <main class="search-page">
      <section class="search-hero">
        <div>
          <p class="section-kicker">Каталог салонов</p>
          <h1>Подберите салон по услуге, цене и ближайшему времени</h1>
          <p>Сравните салоны по району, рейтингу, услугам и свободным слотам для записи.</p>
        </div>
        <div class="search-summary"><strong data-count>${salons.length}</strong><span>вариантов найдено</span></div>
      </section>
      <section class="search-layout" aria-label="Результаты поиска">${filtersPanel(filters)}<div data-explorer>${explorer(salons)}</div></section>
    </main>`);

  const form = page.querySelector('.filters-form');
  const submit = form.querySelector('.filter-submit');

  async function apply(next) {
    filters = next;
    submit.disabled = true;
    submit.textContent = 'Загрузка...';
    ctx.replaceUrl(createSearchUrl(next));
    try {
      salons = await getSalons(next);
      if (!ctx.alive()) return;
      page.querySelector('[data-explorer]').innerHTML = explorer(salons);
      page.querySelector('[data-count]').textContent = salons.length;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Показать';
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    apply({
      query: String(data.get('q') ?? '').trim() || undefined,
      category: String(data.get('category') || 'all'),
      minPrice: data.get('minPrice') ? Number(data.get('minPrice')) : undefined,
      maxPrice: data.get('maxPrice') ? Number(data.get('maxPrice')) : undefined,
      minRating: data.get('minRating') ? Number(data.get('minRating')) : undefined,
      sortBy: String(data.get('sortBy') || 'rating')
    });
  });
  form.querySelector('[data-reset]').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('input').forEach(input => { input.value = ''; });
    form.querySelectorAll('select').forEach(select => { select.selectedIndex = 0; });
    apply({});
  });
}
