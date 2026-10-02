// app/salons/[id]/page.tsx: SalonHeader, ServiceList, MasterList and ReviewPreview.
import { getSalonById } from '../api.js';
import { e, href, img, ratingStars } from '../ui.js';
import { notFoundPage } from './states.js';

const yandexWidget = ({ lat, lng }) => `https://yandex.ru/map-widget/v1/?${new URLSearchParams({ ll: `${lng},${lat}`, pt: `${lng},${lat},pm2rdm`, z: '15' })}`;
const yandexLink = ({ lat, lng }) => `https://yandex.ru/maps/?ll=${lng},${lat}&pt=${lng},${lat},pm2rdm&z=15`;

export function reviewsList(reviews) {
  if (!reviews.length) return '<p class="account-muted">Отзывов пока нет.</p>';
  return `<div class="review-grid">${reviews.map(review => `
    <article class="review-card">
      <div class="review-card-topline"><strong>${e(review.author)}</strong>${ratingStars(review.rating)}</div>
      <p>${e(review.text)}</p>
      <small>${e(review.serviceName)} · ${new Intl.DateTimeFormat('ru-RU').format(new Date(review.createdAt))}</small>
      ${review.isPreliminary ? '<span class="review-badge">Предварительный отзыв</span>' : ''}
    </article>`).join('')}</div>`;
}

export async function salonPage(ctx) {
  const salon = await getSalonById(ctx.params[0]);
  if (!ctx.alive()) return;
  if (!salon) { notFoundPage(ctx); return; }
  ctx.setTitle(`${salon.name} - услуги и запись`);
  const serviceName = new Map(salon.salonServices.map(service => [service.id, service.name]));

  ctx.mount(`
    <main class="salon-profile-page">
      <section class="salon-profile-hero">
        <div class="salon-profile-copy">
          <p class="section-kicker">${e(salon.area)}</p>
          <h1>${e(salon.name)}</h1>
          <p>${e(salon.description)}</p>
          <dl class="salon-profile-facts">
            <div><dt>Рейтинг</dt><dd>${ratingStars(salon.rating, salon.reviewCount)}</dd></div>
            <div><dt>Адрес</dt><dd>${e(salon.address)}</dd></div>
          </dl>
          <div class="salon-hero-actions">
            <a class="card-action" href="${href(`/booking/${salon.id}`)}">Записаться</a>
            <a class="map-focus-action" href="${href('/search')}">Назад в каталог</a>
          </div>
        </div>
        <aside class="salon-location-card" aria-labelledby="salon-address">
          <div class="salon-location-copy">
            <p class="section-kicker">Адрес и график</p>
            <h2 id="salon-address">${e(salon.address)}</h2>
            <p>${e(salon.workingHours)}</p>
            <p>${e(salon.phone)}</p>
            <a class="map-focus-action salon-map-link" href="${yandexLink(salon.coordinates)}" target="_blank" rel="noreferrer">Открыть в Яндекс Картах</a>
          </div>
          <iframe class="salon-mini-map" loading="lazy" src="${yandexWidget(salon.coordinates)}" title="Карта ${e(salon.name)}"></iframe>
          <div class="amenity-list">${salon.amenities.map(amenity => `<span>${e(amenity)}</span>`).join('')}</div>
        </aside>
      </section>

      <section class="profile-section" aria-labelledby="salon-services">
        <div class="profile-section-heading"><p class="section-kicker">Услуги</p><h2 id="salon-services">Выберите услугу</h2></div>
        <div class="profile-service-list">
          ${salon.salonServices.map(service => `<a class="profile-service-card" href="${href(`/booking/${salon.id}?service=${service.id}`)}">
            <div><span>${e(service.categoryLabel)}</span><h3>${e(service.name)}</h3><p>${e(service.description)}</p></div>
            <div class="profile-service-meta"><strong>${service.price.toLocaleString('ru-RU')} ₽</strong><span>${service.durationMinutes} мин</span></div>
          </a>`).join('')}
        </div>
      </section>

      <section class="profile-section" aria-labelledby="salon-masters">
        <div class="profile-section-heading"><p class="section-kicker">Мастера</p><h2 id="salon-masters">Специалисты салона</h2></div>
        <div class="master-grid">
          ${salon.masters.map(master => `<article class="master-card">
            <img src="${img(master.imageUrl)}" alt="Мастер ${e(master.name)}">
            <div>
              <h3>${e(master.name)}</h3><p>${e(master.role)}</p><span>${master.experienceYears} лет опыта</span>${ratingStars(master.rating)}
              <div class="master-tags">${master.serviceIds.map(id => `<small>${e(serviceName.get(id) ?? 'Услуга')}</small>`).join('')}</div>
            </div>
          </article>`).join('')}
        </div>
      </section>

      <section class="profile-section" aria-labelledby="salon-reviews">
        <div class="profile-section-heading"><p class="section-kicker">Отзывы</p><h2 id="salon-reviews">Отзывы клиентов</h2></div>
        ${reviewsList(salon.reviews)}
      </section>
    </main>`);
}
