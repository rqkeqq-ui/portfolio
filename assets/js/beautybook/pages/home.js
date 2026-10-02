// app/page.tsx: HeroSearch, CategoryStrip, HowItWorks, FeaturedSalonsPreview.
import { getSalons } from '../api.js';
import { e, href, img, ratingStars, serviceCategoryLabels } from '../ui.js';

const categoryAccents = { hair: 'coral', barber: 'teal', nails: 'violet', cosmetology: 'gold', massage: 'teal' };
const visibleCategories = ['hair', 'barber', 'nails', 'cosmetology'];
const steps = [
  ['Свободные окна', 'Вы видите только время, которое доступно для выбранного мастера и услуги.'],
  ['Прозрачный выбор', 'В карточке салона есть рейтинг, адрес, цена и список популярных услуг.'],
  ['Личный кабинет', 'После записи визит появится в профиле: его можно отменить или позже оставить отзыв.']
];

export function buildSearchHref({ service, location }) {
  const params = new URLSearchParams();
  if (service?.trim()) params.set('service', service.trim());
  if (location?.trim()) params.set('location', location.trim());
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

export async function homePage(ctx) {
  const salons = (await getSalons({ sortBy: 'rating' })).slice(0, 3);
  if (!ctx.alive()) return;
  ctx.setTitle('BeautyBook | Онлайн-запись в салоны');
  const page = ctx.mount(`
    <main class="site-shell">
      <section class="hero">
        <div class="hero-grid">
          <div>
            <div class="hero-kicker">Онлайн-запись в Барнауле</div>
            <h1 class="hero-title">Найдите салон рядом и <span>запишитесь без звонка</span></h1>
            <p class="hero-copy">Выберите услугу, сравните салоны по рейтингу и цене, забронируйте свободное время мастера.</p>
            <form class="search-panel">
              <div class="search-field"><label for="service">Услуга</label><input id="service" name="service" value="Стрижка" placeholder="Например, маникюр"></div>
              <div class="search-field"><label for="location">Город или район</label><input id="location" name="location" value="Барнаул" placeholder="Например, Центр"></div>
              <button class="search-button" type="submit">Найти</button>
            </form>
            <div class="hero-proof" aria-label="Преимущества сервиса">
              <span><strong>6</strong> салонов</span><span><strong>16:30</strong> ближайшее окно</span><span><strong>24/7</strong> запись онлайн</span>
            </div>
          </div>
          <div class="hero-visual" aria-label="Пример записи">
            <img class="salon-photo" src="${img('hero.jpg')}" alt="Интерьер современного салона красоты">
            <div class="booking-card">
              <h2>Ближайшая запись</h2>
              <div class="booking-row"><span>Мастер</span><strong>Анна Корнеева</strong></div>
              <div class="booking-row"><span>Услуга</span><strong>Стрижка</strong></div>
              <div class="booking-row"><span>Свободно</span><strong>Сегодня 16:30</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="categories-title">
        <div class="section-inner">
          <p class="section-kicker">Популярные услуги</p>
          <h2 id="categories-title" class="section-title">Начните с нужной услуги</h2>
          <div class="category-grid">
            ${visibleCategories.map(category => `<a class="category-card" data-accent="${categoryAccents[category]}" href="${href(`/search?category=${category}`)}"><h3>${serviceCategoryLabels[category]}</h3><p>Салоны, мастера и свободное время</p></a>`).join('')}
          </div>
        </div>
      </section>

      <section class="section product-flow" aria-labelledby="how-title">
        <div class="section-inner">
          <p class="section-kicker">Как это работает</p>
          <h2 id="how-title" class="section-title">Запись занимает несколько минут</h2>
          <div class="steps-grid">
            ${steps.map(([title, text], index) => `<article class="step-card"><div class="step-number">${index + 1}</div><h3>${title}</h3><p>${text}</p></article>`).join('')}
          </div>
        </div>
      </section>

      <section class="section featured-section" aria-labelledby="featured-title">
        <div class="section-inner">
          <p class="section-kicker">Салоны рядом</p>
          <h2 id="featured-title" class="section-title">Места, куда можно записаться сегодня</h2>
          <div class="salon-grid">
            ${salons.map(salon => `<a class="salon-preview" href="${href(`/salons/${salon.id}`)}">
              <img src="${img(salon.imageUrl)}" alt="Фото салона ${e(salon.name)}">
              <div class="salon-preview-body">
                <div class="salon-meta"><span>${e(salon.area)}</span>${ratingStars(salon.rating)}</div>
                <h3>${e(salon.name)}</h3>
                <p>${e(salon.services.slice(0, 3).join(', '))}</p>
                <span class="slot-label">от ${salon.startingPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </a>`).join('')}
          </div>
        </div>
      </section>
    </main>`);

  page.querySelector('.search-panel').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    ctx.navigate(buildSearchHref({ service: String(form.get('service')), location: String(form.get('location')) }));
  });
}
