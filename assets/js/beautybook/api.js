// In-browser stand-in for apps/api: same rules (slots, conflicts, cancellation window, reviews), data kept in localStorage.
import { DEMO_PASSWORD, amenityLabels, categoryLabels, demoUsers, masterSeeds, reviewTexts, salonSeeds, serviceSeeds } from './seed.js';
import { clearStoredSession, getStoredSession, storeSession } from './session.js';

const DB_KEY = 'beautybook.demo.db';
const DB_VERSION = 1;
const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;
const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Times follow the original API: wall-clock salon time stored as UTC, formatted with timeZone UTC.
export const todayKey = () => new Date().toLocaleDateString('en-CA');
const nowWall = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())); };
const addDays = (key, days) => { const d = new Date(`${key}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const at = (key, time) => new Date(`${key}T${time}:00.000Z`);
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
const toMinutes = value => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
const formatMinutes = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
const uid = (prefix = '') => prefix + (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`);
const clone = value => JSON.parse(JSON.stringify(value));
const wait = () => new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 140));

function buildSeed() {
  const today = todayKey();
  const db = {
    version: DB_VERSION,
    users: demoUsers.map((user, index) => ({ ...user, password: DEMO_PASSWORD, isBlocked: false, createdAt: at(addDays(today, -60 + index * 3), '10:00').toISOString() })),
    salons: salonSeeds.map((salon, index) => ({ ...salon, ownerId: 'u-owner', createdAt: at(addDays(today, -90), `0${index}:00`).toISOString() })),
    services: serviceSeeds.map(([salonId, id, name, description, category, durationMinutes, price]) => ({ id, salonId, name, description, category, durationMinutes, price, isActive: true })),
    masters: masterSeeds.map(([salonId, id, name, role, experienceYears, imageUrl, serviceIds]) => ({ id, salonId, name, role, bio: '', experienceYears, imageUrl, isActive: true, serviceIds })),
    workingHours: salonSeeds.flatMap(salon => weekdays.map(weekday => ({ salonId: salon.id, masterId: null, weekday, opensAt: '09:00', closesAt: '21:00', slotStepMinutes: 30, isClosed: false }))),
    timeBlocks: [],
    bookings: [],
    reviews: []
  };
  const clients = db.users.filter(user => user.role === 'CLIENT' && user.id !== 'u-client');
  const service = id => db.services.find(item => item.id === id);
  let clientIndex = 0;

  function book({ salonId, masterId, serviceId, date, time, status = 'CONFIRMED', client = clients[clientIndex++ % clients.length], review }) {
    const startsAt = at(date, time);
    const item = service(serviceId);
    const booking = {
      id: uid(), clientId: client.id, salonId, masterId, serviceId,
      startsAt: startsAt.toISOString(), endsAt: addMinutes(startsAt, item.durationMinutes).toISOString(), status,
      customerName: client.name, customerPhone: client.phone, customerComment: '', totalPriceCents: item.price * 100,
      createdAt: addMinutes(startsAt, -60 * 24 * 3).toISOString()
    };
    db.bookings.push(booking);
    if (review) {
      db.reviews.push({ id: uid(), bookingId: booking.id, clientId: client.id, salonId, masterId, rating: review[0], text: review[1], isPreliminary: false, createdAt: addMinutes(new Date(booking.endsAt), 120).toISOString() });
    }
    return booking;
  }

  // Forma Beauty (the owner's dashboard salon): a month of history and the next few days.
  const annaTimes = ['10:00', '13:00', '17:00'];
  const mariaTimes = ['11:00', '14:30', '18:00'];
  for (let offset = -29; offset <= -1; offset++) {
    const count = (Math.abs(offset) * 7) % 4;
    for (let j = 0; j < count; j++) {
      const anna = j % 2 === 0;
      const master = anna ? 'anna-korneeva' : 'maria-volkova';
      const services = anna ? ['forma-color', 'forma-care'] : ['forma-haircut', 'forma-care'];
      const status = (offset + j) % 9 === 0 ? 'CANCELLED' : 'COMPLETED';
      const review = status === 'COMPLETED' && (offset + j) % 3 === 0 ? [(offset % 5 === 0) ? 4 : 5, reviewTexts[Math.abs(offset + j) % reviewTexts.length]] : undefined;
      book({ salonId: 'forma-beauty', masterId: master, serviceId: services[Math.abs(offset + j) % 2], date: addDays(today, offset), time: (anna ? annaTimes : mariaTimes)[Math.floor(j / 2)], status, review });
    }
  }
  book({ salonId: 'forma-beauty', masterId: 'anna-korneeva', serviceId: 'forma-color', date: today, time: '12:00' });
  book({ salonId: 'forma-beauty', masterId: 'maria-volkova', serviceId: 'forma-haircut', date: today, time: '15:00' });
  book({ salonId: 'forma-beauty', masterId: 'maria-volkova', serviceId: 'forma-care', date: today, time: '18:30' });
  book({ salonId: 'forma-beauty', masterId: 'anna-korneeva', serviceId: 'forma-care', date: addDays(today, 1), time: '11:00' });
  book({ salonId: 'forma-beauty', masterId: 'maria-volkova', serviceId: 'forma-haircut', date: addDays(today, 1), time: '14:00' });
  book({ salonId: 'forma-beauty', masterId: 'maria-volkova', serviceId: 'forma-haircut', date: addDays(today, 3), time: '12:00', client: db.users.find(user => user.id === 'u-client') });

  // Other salons: a few reviewed visits so ratings are not empty.
  const history = [
    ['brutal-room', 'oleg-baranov', 'brutal-haircut', [5, 4, 5]], ['brutal-room', 'ivan-zorin', 'brutal-beard', [5, 5]],
    ['nail-culture', 'sofia-larina', 'nail-manicure', [5, 4]], ['nail-culture', 'vera-minaeva', 'nail-pedicure', [4, 5]],
    ['urban-spa', 'elena-sorokina', 'urban-relax-massage', [5, 5, 5]], ['urban-spa', 'alisa-mironova', 'urban-face-care', [4]],
    ['gloss-studio', 'daria-belova', 'gloss-styling', [5, 4, 4]], ['skin-lab', 'irina-fadeeva', 'skin-cleaning', [5, 5, 4]]
  ];
  history.forEach(([salonId, masterId, serviceId, ratings], row) => ratings.forEach((rating, i) => {
    book({ salonId, masterId, serviceId, date: addDays(today, -(3 + i * 6 + row)), time: i % 2 ? '16:00' : '12:30', status: 'COMPLETED', review: [rating, reviewTexts[(row + i) % reviewTexts.length]] });
  }));
  // The demo client has a finished visit without a review, so the review form can be tried.
  book({ salonId: 'brutal-room', masterId: 'oleg-baranov', serviceId: 'brutal-haircut', date: addDays(today, -5), time: '18:00', status: 'COMPLETED', client: db.users.find(user => user.id === 'u-client') });
  return db;
}

let db = null;
function load() {
  if (db) return db;
  try {
    const stored = JSON.parse(localStorage.getItem(DB_KEY) || 'null');
    if (stored?.version === DB_VERSION) db = stored;
  } catch { /* storage unavailable: fall back to a fresh in-memory seed */ }
  if (!db) { db = buildSeed(); save(); }
  return db;
}
function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* in-memory only */ }
}

export function resetDemo() {
  db = buildSeed();
  save();
  clearStoredSession();
}

function completePastBookings(data) {
  const now = nowWall();
  let changed = false;
  data.bookings.forEach(booking => {
    if (booking.status === 'CONFIRMED' && new Date(booking.endsAt) < now) { booking.status = 'COMPLETED'; changed = true; }
  });
  if (changed) save();
}

function average(values) {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
}
const salonRating = (data, salonId) => average(data.reviews.filter(review => review.salonId === salonId).map(review => review.rating));
const masterRating = (data, masterId) => average(data.reviews.filter(review => review.masterId === masterId).map(review => review.rating));

function currentUser(allowedRoles) {
  const data = load();
  const session = getStoredSession();
  const user = session && data.users.find(item => item.id === session.user.id);
  if (!user) throw new ApiError('Нужно войти в аккаунт', 'UNAUTHORIZED', 401);
  if (user.isBlocked) { clearStoredSession(); throw new ApiError('Аккаунт заблокирован', 'ACCOUNT_BLOCKED', 403); }
  if (allowedRoles && !allowedRoles.includes(user.role)) throw new ApiError('Недостаточно прав', 'FORBIDDEN', 403);
  return user;
}

function ownSalon(user) {
  const salon = load().salons.filter(item => item.ownerId === user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (!salon) throw new ApiError('Для этого аккаунта ещё не создан салон', 'SALON_NOT_FOUND', 404);
  return salon;
}

/* ---------- Public catalogue ---------- */
function toListItem(data, salon) {
  const services = data.services.filter(item => item.salonId === salon.id && item.isActive);
  return {
    id: salon.id, name: salon.name, area: salon.area, address: salon.address, distanceKm: null,
    rating: salonRating(data, salon.id), reviewCount: data.reviews.filter(review => review.salonId === salon.id).length,
    startingPrice: services.length ? Math.min(...services.map(item => item.price)) : 0,
    categories: [...new Set(services.map(item => item.category))], services: services.map(item => item.name),
    nextSlot: 'Сегодня, 16:30', imageUrl: salon.imageUrl, coordinates: { lat: salon.lat, lng: salon.lng }
  };
}

export async function getSalons(filters = {}) {
  await wait();
  const data = load();
  const query = (filters.query || '').trim().toLowerCase();
  return clone(data.salons
    .filter(salon => data.services.some(item => item.salonId === salon.id && item.isActive))
    .map(salon => toListItem(data, salon))
    .filter(salon => !query || [salon.name, salon.area, salon.address, ...salon.services].some(value => value.toLowerCase().includes(query)))
    .filter(salon => !filters.category || filters.category === 'all' || salon.categories.includes(filters.category))
    .filter(salon => !filters.minPrice || salon.startingPrice >= filters.minPrice)
    .filter(salon => !filters.maxPrice || salon.startingPrice <= filters.maxPrice)
    .filter(salon => !filters.minRating || salon.rating >= filters.minRating)
    .sort((a, b) => filters.sortBy === 'price' ? a.startingPrice - b.startingPrice : filters.sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name)));
}

export async function getSalonById(id) {
  await wait();
  const data = load();
  const salon = data.salons.find(item => item.id === id);
  if (!salon) return undefined;
  const services = data.services.filter(item => item.salonId === salon.id && item.isActive);
  return clone({
    ...toListItem(data, salon),
    description: salon.description, gallery: [salon.imageUrl], workingHours: 'Пн-Пт, 09:00-21:00', phone: salon.phone,
    amenities: amenityLabels[salon.id] ?? ['Онлайн-запись', 'Оплата картой'],
    salonServices: services.map(item => ({ id: item.id, name: item.name, description: item.description, durationMinutes: item.durationMinutes, price: item.price, categoryLabel: categoryLabels[item.category] ?? item.category })),
    masters: data.masters.filter(item => item.salonId === salon.id && item.isActive).map(item => ({ id: item.id, name: item.name, role: item.role, experienceYears: item.experienceYears, rating: masterRating(data, item.id), serviceIds: item.serviceIds.filter(serviceId => services.some(service => service.id === serviceId)), imageUrl: item.imageUrl })),
    reviews: data.reviews.filter(review => review.salonId === salon.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(review => ({
      id: review.id, author: data.users.find(user => user.id === review.clientId)?.name ?? 'Клиент', rating: review.rating, createdAt: review.createdAt,
      serviceName: data.services.find(item => item.id === data.bookings.find(booking => booking.id === review.bookingId)?.serviceId)?.name ?? 'Услуга',
      text: review.text, isPreliminary: review.isPreliminary
    }))
  });
}

/* ---------- Availability and booking ---------- */
function workingHoursFor(data, master, date) {
  const weekday = weekdays[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
  return data.workingHours.find(item => item.masterId === master.id && item.weekday === weekday)
    ?? data.workingHours.find(item => item.salonId === master.salonId && item.masterId === null && item.weekday === weekday);
}

function blockedIntervals(data, masterId) {
  return [
    ...data.timeBlocks.filter(item => item.masterId === masterId),
    ...data.bookings.filter(item => item.masterId === masterId && item.status !== 'CANCELLED')
  ].map(item => ({ startsAt: new Date(item.startsAt), endsAt: new Date(item.endsAt) }));
}

export async function getAvailabilitySlots({ masterId, serviceId, date }) {
  await wait();
  const data = load();
  const master = data.masters.find(item => item.id === masterId && item.isActive);
  const service = data.services.find(item => item.id === serviceId && item.isActive);
  if (!master || !service || !master.serviceIds.includes(service.id)) throw new ApiError('Мастер или услуга не найдены', 'AVAILABILITY_NOT_FOUND', 404);
  const hours = workingHoursFor(data, master, date);
  if (!hours || hours.isClosed) return [];
  const blocked = blockedIntervals(data, master.id);
  const now = nowWall();
  const slots = [];
  for (let start = toMinutes(hours.opensAt); start + service.durationMinutes <= toMinutes(hours.closesAt); start += hours.slotStepMinutes) {
    const startsAt = at(date, formatMinutes(start));
    const endsAt = addMinutes(startsAt, service.durationMinutes);
    if (startsAt < now || blocked.some(interval => overlaps(startsAt, endsAt, interval.startsAt, interval.endsAt))) continue;
    const startTime = formatMinutes(start);
    const endTime = formatMinutes(start + service.durationMinutes);
    slots.push({ id: `${date}-${master.id}-${startTime.replace(':', '')}`, date, startTime, endTime, label: `${startTime}-${endTime}`, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
  }
  return slots;
}

function toBookingDto(data, booking) {
  const salon = data.salons.find(item => item.id === booking.salonId);
  const master = data.masters.find(item => item.id === booking.masterId);
  const service = data.services.find(item => item.id === booking.serviceId);
  return clone({
    ...booking,
    salon: salon && { name: salon.name, slug: salon.id, address: salon.address },
    master: master && { id: master.id, name: master.name, role: master.role },
    service: service && { id: service.id, name: service.name, durationMinutes: service.durationMinutes },
    hasReview: data.reviews.some(review => review.bookingId === booking.id)
  });
}

export async function createBooking({ masterId, serviceId, startsAt, customerName, customerPhone, customerComment }) {
  await wait();
  const user = currentUser();
  const data = load();
  const master = data.masters.find(item => item.id === masterId && item.isActive);
  const service = data.services.find(item => item.id === serviceId && item.isActive);
  if (!master || !service || !master.serviceIds.includes(serviceId)) throw new ApiError('Мастер или услуга не найдены', 'BOOKING_TARGET_NOT_FOUND', 404);
  const start = new Date(startsAt);
  const end = addMinutes(start, service.durationMinutes);
  const hours = workingHoursFor(data, master, startsAt.slice(0, 10));
  const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
  if (!hours || hours.isClosed || startMinutes < toMinutes(hours.opensAt) || startMinutes + service.durationMinutes > toMinutes(hours.closesAt)) {
    throw new ApiError('Выбранное время вне рабочих часов', 'SLOT_NOT_AVAILABLE', 409);
  }
  if (blockedIntervals(data, master.id).some(interval => overlaps(start, end, interval.startsAt, interval.endsAt))) {
    throw new ApiError('Это время уже занято, выберите другой слот', 'SLOT_ALREADY_BOOKED', 409);
  }
  const booking = {
    id: uid(), clientId: user.id, salonId: master.salonId, masterId, serviceId, startsAt: start.toISOString(), endsAt: end.toISOString(),
    status: 'CONFIRMED', customerName, customerPhone, customerComment: customerComment || '', totalPriceCents: service.price * 100, createdAt: new Date().toISOString()
  };
  data.bookings.push(booking);
  save();
  return toBookingDto(data, booking);
}

/* ---------- Auth ---------- */
function sessionFor(user) {
  return { user: { id: user.id, email: user.email, name: user.name, phone: user.phone ?? null, role: user.role }, accessToken: `demo.${uid()}`, refreshToken: `demo.${uid()}` };
}

export async function login({ email, password }) {
  await wait();
  const user = load().users.find(item => item.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!user || user.password !== password) throw new ApiError('Неверный email или пароль', 'INVALID_CREDENTIALS', 401);
  if (user.isBlocked) throw new ApiError('Аккаунт заблокирован', 'ACCOUNT_BLOCKED', 403);
  const session = sessionFor(user);
  storeSession(session);
  return session;
}

export async function loginAsDemo(role) {
  const email = { CLIENT: 'client@beautybook.local', SALON_OWNER: 'owner@beautybook.local', SUPER_ADMIN: 'admin@beautybook.local' }[role];
  const user = load().users.find(item => item.email === email);
  if (user) user.isBlocked = false;
  save();
  return login({ email, password: DEMO_PASSWORD });
}

async function register(role, { name, email, phone, password }) {
  await wait();
  const data = load();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError('Укажите корректный email', 'INVALID_EMAIL', 400);
  if (String(password).length < 8) throw new ApiError('Пароль должен быть не короче 8 символов', 'INVALID_PASSWORD', 400);
  if (data.users.some(user => user.email.toLowerCase() === email.toLowerCase())) throw new ApiError('Пользователь с таким email уже существует', 'EMAIL_ALREADY_EXISTS', 409);
  const user = { id: uid('u-'), email: email.trim(), name: name.trim(), phone: phone?.trim() || null, role, password, isBlocked: false, createdAt: new Date().toISOString() };
  data.users.push(user);
  save();
  const session = sessionFor(user);
  storeSession(session);
  return session;
}
export const registerClient = input => register('CLIENT', input);
export const registerSalonOwner = input => register('SALON_OWNER', input);
export async function logout() { clearStoredSession(); }

/* ---------- Client account ---------- */
export async function getClientProfile() {
  await wait();
  const user = currentUser();
  return clone({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, createdAt: user.createdAt });
}

export async function listClientBookings() {
  await wait();
  const user = currentUser();
  const data = load();
  completePastBookings(data);
  return data.bookings.filter(item => item.clientId === user.id).sort((a, b) => b.startsAt.localeCompare(a.startsAt)).map(item => toBookingDto(data, item));
}

export async function cancelClientBooking(bookingId) {
  await wait();
  const user = currentUser();
  const data = load();
  const booking = data.bookings.find(item => item.id === bookingId && item.clientId === user.id);
  if (!booking) throw new ApiError('Запись не найдена', 'BOOKING_NOT_FOUND', 404);
  if (booking.status !== 'CONFIRMED') throw new ApiError('Отменить можно только подтверждённую запись', 'BOOKING_NOT_CANCELLABLE', 409);
  if (new Date(booking.startsAt) - nowWall() < CANCELLATION_WINDOW_MS) throw new ApiError('Запись нельзя отменить менее чем за 2 часа до начала', 'CANCELLATION_WINDOW_CLOSED', 409);
  booking.status = 'CANCELLED';
  save();
  return toBookingDto(data, booking);
}

export async function createReview({ bookingId, rating, text }) {
  await wait();
  const user = currentUser();
  const data = load();
  const booking = data.bookings.find(item => item.id === bookingId && item.clientId === user.id);
  if (!booking) throw new ApiError('Запись не найдена', 'BOOKING_NOT_FOUND', 404);
  if (booking.status === 'CANCELLED') throw new ApiError('Нельзя оставить отзыв на отменённую запись', 'BOOKING_CANCELLED', 409);
  if (data.reviews.some(review => review.bookingId === booking.id)) throw new ApiError('Отзыв на эту запись уже оставлен', 'REVIEW_ALREADY_EXISTS', 409);
  const review = { id: uid(), bookingId, clientId: user.id, salonId: booking.salonId, masterId: booking.masterId, rating, text: text.trim(), isPreliminary: booking.status !== 'COMPLETED' && new Date(booking.endsAt) > nowWall(), createdAt: new Date().toISOString() };
  data.reviews.push(review);
  save();
  return clone(review);
}

/* ---------- Salon dashboard ---------- */
export async function getDashboardSummary() {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  completePastBookings(data);
  const today = todayKey();
  const weekStart = addDays(today, -6);
  const tomorrow = addDays(today, 1);
  const own = data.bookings.filter(item => item.salonId === salon.id);
  const dateOf = item => item.startsAt.slice(0, 10);
  const week = own.filter(item => dateOf(item) >= weekStart && dateOf(item) < tomorrow && item.status !== 'CANCELLED');
  return {
    bookingsToday: own.filter(item => dateOf(item) === today && item.status !== 'CANCELLED').length,
    upcomingBookings: own.filter(item => item.status === 'CONFIRMED' && dateOf(item) >= today).length,
    newClients: new Set(week.map(item => item.clientId)).size,
    averageRating: salonRating(data, salon.id),
    weeklyRevenueCents: week.filter(item => item.status === 'COMPLETED').reduce((sum, item) => sum + item.totalPriceCents, 0)
  };
}

export async function getBookingsChart() {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  const end = todayKey();
  const points = Array.from({ length: 30 }, (_, index) => ({ date: addDays(end, index - 29), bookings: 0, revenueCents: 0 }));
  data.bookings.filter(item => item.salonId === salon.id && item.status !== 'CANCELLED').forEach(item => {
    const point = points.find(entry => entry.date === item.startsAt.slice(0, 10));
    if (!point) return;
    point.bookings += 1;
    if (item.status === 'COMPLETED') point.revenueCents += item.totalPriceCents;
  });
  return points;
}

export async function listSalonBookings(filter = {}) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  completePastBookings(data);
  return data.bookings
    .filter(item => item.salonId === salon.id)
    .filter(item => !filter.date || item.startsAt.slice(0, 10) === filter.date)
    .filter(item => !filter.masterId || item.masterId === filter.masterId)
    .filter(item => !filter.status || item.status === filter.status)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map(item => toBookingDto(data, item));
}

export async function updateSalonBookingStatus(bookingId, status, cancelReason) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  const booking = data.bookings.find(item => item.id === bookingId && item.salonId === salon.id);
  if (!booking) throw new ApiError('Запись не найдена в текущем салоне', 'BOOKING_NOT_FOUND', 404);
  booking.status = status;
  if (status === 'CANCELLED' && cancelReason) booking.cancelReason = cancelReason;
  save();
  return toBookingDto(data, booking);
}

const toDashboardService = item => clone({ id: item.id, slug: item.id, name: item.name, description: item.description, category: item.category, durationMinutes: item.durationMinutes, price: item.price, isActive: item.isActive });

export async function listDashboardServices() {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  return load().services.filter(item => item.salonId === salon.id).map(toDashboardService);
}

function validateService(payload, partial) {
  if (!partial || payload.name !== undefined) if (!String(payload.name ?? '').trim()) throw new ApiError('Укажите название услуги', 'INVALID_SERVICE_FIELD', 400);
  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) throw new ApiError('Цена не может быть отрицательной', 'INVALID_SERVICE_PRICE', 400);
  if (payload.durationMinutes !== undefined && (!Number.isFinite(payload.durationMinutes) || payload.durationMinutes < 15)) throw new ApiError('Длительность услуги — не меньше 15 минут', 'INVALID_SERVICE_DURATION', 400);
}

export async function createDashboardService(payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  validateService(payload, false);
  const data = load();
  const item = { id: uid('svc-').slice(0, 16), salonId: salon.id, ...payload, name: payload.name.trim(), description: payload.description.trim() };
  data.services.unshift(item);
  save();
  return toDashboardService(item);
}

export async function updateDashboardService(serviceId, payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  validateService(payload, true);
  const data = load();
  const item = data.services.find(entry => entry.id === serviceId && entry.salonId === salon.id);
  if (!item) throw new ApiError('Услуга не найдена в текущем салоне', 'SERVICE_NOT_FOUND', 404);
  Object.assign(item, payload);
  save();
  return toDashboardService(item);
}

function toDashboardMaster(data, item) {
  return clone({
    id: item.id, slug: item.id, name: item.name, role: item.role, bio: item.bio, experienceYears: item.experienceYears, rating: masterRating(data, item.id),
    imageUrl: item.imageUrl, isActive: item.isActive,
    services: item.serviceIds.map(id => data.services.find(service => service.id === id)).filter(Boolean).map(service => ({ id: service.id, slug: service.id, name: service.name }))
  });
}

export async function listDashboardMasters() {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  return data.masters.filter(item => item.salonId === salon.id).map(item => toDashboardMaster(data, item));
}

function validateMaster(payload, partial, salonId) {
  if (!partial && (!payload.name || !payload.role)) throw new ApiError('Укажите имя и специализацию мастера', 'INVALID_MASTER_FIELD', 400);
  if (payload.experienceYears !== undefined && (!Number.isFinite(payload.experienceYears) || payload.experienceYears < 0)) throw new ApiError('Опыт не может быть отрицательным', 'INVALID_MASTER_EXPERIENCE', 400);
  if (payload.serviceIds && payload.serviceIds.some(id => !load().services.some(service => service.id === id && service.salonId === salonId))) {
    throw new ApiError('Все услуги мастера должны относиться к текущему салону', 'INVALID_MASTER_SERVICES', 400);
  }
}

export async function createDashboardMaster(payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  validateMaster(payload, false, salon.id);
  const data = load();
  const item = { id: uid('m-').slice(0, 14), salonId: salon.id, name: payload.name, role: payload.role, bio: payload.bio, experienceYears: payload.experienceYears, imageUrl: payload.imageUrl || 'masters/photo-1594824476967-48c8b964273f.jpg', isActive: payload.isActive, serviceIds: payload.serviceIds };
  data.masters.unshift(item);
  save();
  return toDashboardMaster(data, item);
}

export async function updateDashboardMaster(masterId, payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  validateMaster(payload, true, salon.id);
  const data = load();
  const item = data.masters.find(entry => entry.id === masterId && entry.salonId === salon.id);
  if (!item) throw new ApiError('Мастер не найден в текущем салоне', 'MASTER_NOT_FOUND', 404);
  const { imageUrl, ...rest } = payload;
  Object.assign(item, rest, imageUrl ? { imageUrl } : {});
  save();
  return toDashboardMaster(data, item);
}

export async function deleteDashboardMaster(masterId) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  const item = data.masters.find(entry => entry.id === masterId && entry.salonId === salon.id);
  if (!item) throw new ApiError('Мастер не найден в текущем салоне', 'MASTER_NOT_FOUND', 404);
  data.masters = data.masters.filter(entry => entry.id !== masterId);
  save();
  return toDashboardMaster(data, item);
}

export async function saveWorkingHours(masterId, payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  if (!data.masters.some(item => item.id === masterId && item.salonId === salon.id)) throw new ApiError('Мастер не найден в текущем салоне', 'MASTER_NOT_FOUND', 404);
  if (!payload.isClosed && toMinutes(payload.opensAt) >= toMinutes(payload.closesAt)) throw new ApiError('Время окончания должно быть позже начала', 'INVALID_WORKING_HOURS', 400);
  data.workingHours = data.workingHours.filter(item => !(item.masterId === masterId && item.weekday === payload.weekday));
  data.workingHours.push({ salonId: salon.id, masterId, ...payload });
  save();
  return { masterId, ...payload };
}

export async function createTimeBlock(masterId, payload) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  const data = load();
  if (!data.masters.some(item => item.id === masterId && item.salonId === salon.id)) throw new ApiError('Мастер не найден в текущем салоне', 'MASTER_NOT_FOUND', 404);
  if (!(new Date(payload.startsAt) < new Date(payload.endsAt))) throw new ApiError('Конец блокировки должен быть позже начала', 'INVALID_TIME_BLOCK', 400);
  const block = { id: uid(), masterId, ...payload };
  data.timeBlocks.push(block);
  save();
  return clone(block);
}

const toSettings = salon => clone({ id: salon.id, name: salon.name, description: salon.description, area: salon.area, address: salon.address, phone: salon.phone, imageUrl: salon.imageUrl, coordinates: { lat: salon.lat, lng: salon.lng } });

function validateSettings(input) {
  for (const key of ['name', 'description', 'area', 'address', 'phone']) {
    if (!String(input[key] ?? '').trim()) throw new ApiError('Заполните все обязательные поля', 'INVALID_SALON_FIELD', 400);
  }
  if (!Number.isFinite(input.coordinates?.lat) || !Number.isFinite(input.coordinates?.lng)) throw new ApiError('Координаты должны быть числами', 'INVALID_COORDINATES', 400);
}

export async function getOwnSalonSettings() {
  await wait();
  return toSettings(ownSalon(currentUser(['SALON_OWNER'])));
}

export async function createOwnSalonSettings(input) {
  await wait();
  const user = currentUser(['SALON_OWNER']);
  const data = load();
  if (data.salons.some(item => item.ownerId === user.id)) throw new ApiError('Для этого аккаунта уже создан салон', 'SALON_ALREADY_EXISTS', 409);
  validateSettings(input);
  const base = input.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '') || 'salon';
  const salon = { id: `${base}-${uid().slice(0, 4)}`, ownerId: user.id, name: input.name, description: input.description, area: input.area, address: input.address, phone: input.phone, lat: input.coordinates.lat, lng: input.coordinates.lng, imageUrl: input.imageUrl || 'salons/salon-3993449.jpg', createdAt: new Date().toISOString() };
  data.salons.push(salon);
  data.workingHours.push(...weekdays.map(weekday => ({ salonId: salon.id, masterId: null, weekday, opensAt: '09:00', closesAt: '21:00', slotStepMinutes: 30, isClosed: false })));
  save();
  return toSettings(salon);
}

export async function updateOwnSalonSettings(input) {
  await wait();
  const salon = ownSalon(currentUser(['SALON_OWNER']));
  validateSettings(input);
  Object.assign(salon, { name: input.name, description: input.description, area: input.area, address: input.address, phone: input.phone, lat: input.coordinates.lat, lng: input.coordinates.lng }, input.imageUrl ? { imageUrl: input.imageUrl } : {});
  save();
  return toSettings(salon);
}

/* ---------- System admin ---------- */
const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
const toAdminUser = user => ({ id: user.id, email: user.email, name: user.name, role: user.role, isBlocked: user.isBlocked, createdAt: user.createdAt });

export async function getSuperAdminSummary() {
  await wait();
  currentUser(adminRoles);
  const data = load();
  return { usersTotal: data.users.length, salonsTotal: data.salons.length, bookingsTotal: data.bookings.length, blockedUsers: data.users.filter(user => user.isBlocked).length };
}

export async function listSuperAdminUsers() {
  await wait();
  currentUser(adminRoles);
  return clone(load().users.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAdminUser));
}

export async function listSuperAdminSalons() {
  await wait();
  currentUser(adminRoles);
  const data = load();
  return clone(data.salons.map(salon => {
    const owner = data.users.find(user => user.id === salon.ownerId);
    return {
      id: salon.id, slug: salon.id, name: salon.name, area: salon.area, address: salon.address, rating: salonRating(data, salon.id),
      reviewCount: data.reviews.filter(review => review.salonId === salon.id).length, bookingsCount: data.bookings.filter(item => item.salonId === salon.id).length,
      servicesCount: data.services.filter(item => item.salonId === salon.id).length, mastersCount: data.masters.filter(item => item.salonId === salon.id).length,
      createdAt: salon.createdAt, owner: owner ? { id: owner.id, email: owner.email, name: owner.name } : null
    };
  }));
}

export async function setSuperAdminUserBlocked(userId, isBlocked) {
  await wait();
  const admin = currentUser(adminRoles);
  if (admin.id === userId) throw new ApiError('Нельзя заблокировать собственный аккаунт', 'SELF_BLOCK', 400);
  const user = load().users.find(item => item.id === userId);
  if (!user) throw new ApiError('Пользователь не найден', 'USER_NOT_FOUND', 404);
  user.isBlocked = isBlocked;
  save();
  return clone(toAdminUser(user));
}
