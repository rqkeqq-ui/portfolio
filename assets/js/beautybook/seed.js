// Demo data ported from apps/api/prisma/seed.ts, plus fictional bookings and reviews so every screen has content.
export const DEMO_PASSWORD = 'Demo12345!';

export const salonSeeds = [
  { id: 'forma-beauty', name: 'Forma Beauty', description: 'Городской салон с фокусом на окрашивание, уходы и аккуратную диагностику волос.', area: 'Центральный район', address: 'ул. Молодёжная, 12', phone: '+7 (3852) 44-18-22', lat: 53.3481, lng: 83.7798, imageUrl: 'salons/salon-3993449.jpg' },
  { id: 'brutal-room', name: 'Brutal Room', description: 'Барбершоп в центре города для быстрых стрижек, ухода за бородой и камуфляжа седины.', area: 'Площадь Октября', address: 'пр. Ленина, 54', phone: '+7 (3852) 31-22-09', lat: 53.3434, lng: 83.7756, imageUrl: 'salons/salon-1813272.jpg' },
  { id: 'nail-culture', name: 'Nail Culture', description: 'Нейл-студия с одноразовыми расходниками, стерилизацией инструментов и спокойными оттенками.', area: 'Индустриальный район', address: 'ул. Взлётная, 33', phone: '+7 (3852) 20-44-91', lat: 53.3602, lng: 83.7069, imageUrl: 'salons/salon-3997391.jpg' },
  { id: 'urban-spa', name: 'Urban Spa', description: 'Студия массажа и ухода за лицом с приватными кабинетами и спокойной атмосферой.', area: 'Нагорный район', address: 'ул. Партизанская, 83', phone: '+7 (3852) 58-40-16', lat: 53.3326, lng: 83.7891, imageUrl: 'salons/salon-3997382.jpg' },
  { id: 'gloss-studio', name: 'Gloss Studio', description: 'Салон для окрашивания, укладок и экспресс-маникюра рядом с торговым кварталом.', area: 'Индустриальный район', address: 'пр. Космонавтов, 6г', phone: '+7 (3852) 46-90-11', lat: 53.3619, lng: 83.6904, imageUrl: 'salons/salon-3992870.jpg' },
  { id: 'skin-lab', name: 'Skin Lab', description: 'Косметологическая студия с уходовыми процедурами, чистками и консультациями.', area: 'Центральный район', address: 'ул. Пролетарская, 92', phone: '+7 (3852) 61-35-28', lat: 53.3498, lng: 83.7672, imageUrl: 'salons/salon-3762876.jpg' }
];

export const serviceSeeds = [
  ['forma-beauty', 'forma-haircut', 'Женская стрижка', 'Консультация, мытьё, стрижка и укладка по форме.', 'hair', 75, 1400],
  ['forma-beauty', 'forma-color', 'Окрашивание', 'Тон в тон, сложное окрашивание или обновление оттенка.', 'hair', 150, 4200],
  ['forma-beauty', 'forma-care', 'Уход для волос', 'Восстановление, питание и защита после окрашивания.', 'cosmetology', 60, 1900],
  ['brutal-room', 'brutal-haircut', 'Мужская стрижка', 'Стрижка машинкой и ножницами с финальной укладкой.', 'barber', 45, 900],
  ['brutal-room', 'brutal-beard', 'Стрижка бороды', 'Форма бороды, окантовка и уход горячим полотенцем.', 'barber', 35, 700],
  ['brutal-room', 'brutal-camo', 'Камуфляж седины', 'Деликатное тонирование волос или бороды.', 'barber', 40, 1200],
  ['nail-culture', 'nail-manicure', 'Маникюр', 'Аппаратный маникюр, покрытие и лёгкое выравнивание.', 'nails', 105, 1800],
  ['nail-culture', 'nail-pedicure', 'Педикюр', 'Обработка стопы, пальцев и покрытие по желанию.', 'nails', 120, 2200],
  ['nail-culture', 'nail-design', 'Дизайн ногтей', 'Минималистичный дизайн, френч или акцентные ногти.', 'nails', 30, 500],
  ['nail-culture', 'nail-removal', 'Снятие покрытия', 'Бережное снятие старого покрытия перед новой услугой.', 'nails', 25, 300],
  ['urban-spa', 'urban-relax-massage', 'Расслабляющий массаж', 'Массаж спины и шейно-воротниковой зоны для снятия напряжения.', 'massage', 60, 2500],
  ['urban-spa', 'urban-face-care', 'Уход за лицом', 'Очищение, маска и увлажнение по типу кожи.', 'cosmetology', 75, 3200],
  ['gloss-studio', 'gloss-styling', 'Укладка', 'Повседневная или вечерняя укладка с фиксацией.', 'hair', 60, 1600],
  ['gloss-studio', 'gloss-manicure', 'Экспресс-маникюр', 'Аппаратный маникюр без покрытия или с однотонным покрытием.', 'nails', 90, 1700],
  ['skin-lab', 'skin-cleaning', 'Чистка лица', 'Комбинированная чистка с завершающим успокаивающим уходом.', 'cosmetology', 90, 3500],
  ['skin-lab', 'skin-consult', 'Консультация косметолога', 'Разбор состояния кожи и подбор домашнего ухода.', 'cosmetology', 30, 900]
];

export const masterSeeds = [
  ['forma-beauty', 'anna-korneeva', 'Анна Корнеева', 'Стилист-колорист', 8, 'masters/photo-1580618672591-eb180b1a973f.jpg', ['forma-color', 'forma-care']],
  ['forma-beauty', 'maria-volkova', 'Мария Волкова', 'Парикмахер-стилист', 5, 'masters/photo-1595475884562-073c30d45670.jpg', ['forma-haircut', 'forma-care']],
  ['brutal-room', 'oleg-baranov', 'Олег Баранов', 'Барбер', 7, 'masters/photo-1622902046580-2b47f47f5471.jpg', ['brutal-haircut', 'brutal-beard']],
  ['brutal-room', 'ivan-zorin', 'Иван Зорин', 'Старший барбер', 10, 'masters/photo-1560250097-0b93528c311a.jpg', ['brutal-haircut', 'brutal-beard', 'brutal-camo']],
  ['nail-culture', 'sofia-larina', 'София Ларина', 'Nail-мастер', 4, 'masters/photo-1607746882042-944635dfe10e.jpg', ['nail-manicure', 'nail-design', 'nail-removal']],
  ['nail-culture', 'vera-minaeva', 'Вера Минаева', 'Мастер педикюра', 6, 'masters/photo-1551836022-d5d88e9218df.jpg', ['nail-pedicure', 'nail-manicure', 'nail-removal']],
  ['urban-spa', 'elena-sorokina', 'Елена Сорокина', 'Массажист', 9, 'masters/photo-1519824145371-296894a0daa9.jpg', ['urban-relax-massage']],
  ['urban-spa', 'alisa-mironova', 'Алиса Миронова', 'Косметолог', 6, 'masters/photo-1573496359142-b8d87734a5a2.jpg', ['urban-face-care']],
  ['gloss-studio', 'daria-belova', 'Дарья Белова', 'Стилист', 5, 'masters/photo-1594824476967-48c8b964273f.jpg', ['gloss-styling']],
  ['skin-lab', 'irina-fadeeva', 'Ирина Фадеева', 'Косметолог-эстетист', 11, 'masters/photo-1559839734-2b71ea197ec2.jpg', ['skin-cleaning', 'skin-consult']]
];

export const demoUsers = [
  { id: 'u-owner', email: 'owner@beautybook.local', name: 'Мария Соколова', phone: '+7 900 222-44-66', role: 'SALON_OWNER' },
  { id: 'u-client', email: 'client@beautybook.local', name: 'Иван Иванов', phone: '+7 900 111-22-33', role: 'CLIENT' },
  { id: 'u-admin', email: 'admin@beautybook.local', name: 'Алексей Орлов', phone: '+7 900 333-55-77', role: 'SUPER_ADMIN' },
  { id: 'u-ekaterina', email: 'ekaterina@example.com', name: 'Екатерина Смирнова', phone: '+7 913 204-18-11', role: 'CLIENT' },
  { id: 'u-irina', email: 'irina@example.com', name: 'Ирина Павлова', phone: '+7 913 377-02-45', role: 'CLIENT' },
  { id: 'u-alina', email: 'alina@example.com', name: 'Алина Морозова', phone: '+7 962 811-56-30', role: 'CLIENT' },
  { id: 'u-dmitry', email: 'dmitry@example.com', name: 'Дмитрий Ковалёв', phone: '+7 923 640-71-19', role: 'CLIENT' },
  { id: 'u-ksenia', email: 'ksenia@example.com', name: 'Ксения Лебедева', phone: '+7 905 912-33-08', role: 'CLIENT' }
];

export const reviewTexts = [
  'Отличная стрижка и внимательный мастер.',
  'Всё понравилось: пришла по записи, ждать не пришлось.',
  'Аккуратно, быстро и без навязывания лишних услуг.',
  'Мастер подробно объяснил домашний уход, результат держится.',
  'Уютно, чисто, приятная атмосфера. Приду ещё.',
  'Хороший результат, но немного задержались с началом.'
];

export const amenityLabels = {
  'forma-beauty': ['Онлайн-запись', 'Парковка рядом', 'Чай и кофе', 'Оплата картой'],
  'brutal-room': ['Онлайн-запись', 'Мужская косметика', 'Оплата картой'],
  'nail-culture': ['Стерилизация', 'Дизайн ногтей', 'Онлайн-запись'],
  'urban-spa': ['Приватные кабинеты', 'Онлайн-запись', 'Подарочные сертификаты'],
  'gloss-studio': ['Окрашивание', 'Маникюр', 'Оплата картой'],
  'skin-lab': ['Косметология', 'Консультации', 'Онлайн-запись']
};

export const categoryLabels = { hair: 'Стрижки', barber: 'Барберинг', nails: 'Маникюр', cosmetology: 'Косметология', massage: 'Массаж' };
