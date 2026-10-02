// Shared helpers that replace small React components and Intl formatters from apps/web.
const root = document.body.dataset.root || '.';

export const serviceCategoryLabels = { hair: 'Стрижки', barber: 'Барберинг', nails: 'Маникюр', cosmetology: 'Косметология', massage: 'Массаж' };

export const e = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

// Hash routes keep every page working on GitHub Pages without server rewrites.
export const href = path => `#${path}`;

export function img(src) {
  if (!src) return '';
  if (/^(data:|https?:|blob:)/.test(src)) return src;
  return `${root}/assets/images/beautybook/${src.replace(/^\/?img\//, '')}`;
}

export const rub = value => `${Number(value).toLocaleString('ru-RU')} ₽`;
export const centsToRub = cents => `${Math.round(cents / 100).toLocaleString('ru-RU')} ₽`;
export const formatUtc = (value, options) => new Intl.DateTimeFormat('ru-RU', { ...options, timeZone: 'UTC' }).format(new Date(value));

function ratingTone(rating) {
  if (rating >= 4.9) return 'gold';
  if (rating >= 4.5) return 'high';
  if (rating >= 3.5) return 'medium';
  return 'low';
}

export function ratingStars(rating, reviewCount) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const hasReviews = reviewCount === undefined ? value > 0 : reviewCount > 0;
  return `<span class="rating-stars" data-tone="${ratingTone(value)}" aria-label="${hasReviews ? `Рейтинг ${value.toFixed(1)} из 5` : 'Пока нет оценок'}">
    <span class="rating-stars-icons" aria-hidden="true" style="--rating-percent:${(value / 5) * 100}%"><span class="rating-stars-empty">★★★★★</span><span class="rating-stars-filled">★★★★★</span></span>
    ${hasReviews ? `<strong>${value.toFixed(1)}</strong>` : '<strong>Нет оценок</strong>'}
    ${reviewCount !== undefined && reviewCount > 0 ? `<small>${reviewCount} отзывов</small>` : ''}
  </span>`;
}

export const errorText = (error, fallback) => (error instanceof Error && error.message ? error.message : fallback);

export function readImageFile(form, key) {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0) return Promise.resolve(undefined);
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Загрузите изображение в формате JPG, PNG или WebP'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
    reader.readAsDataURL(file);
  });
}

export const readNumber = (form, key) => Number(String(form.get(key) ?? '').replace(',', '.'));
