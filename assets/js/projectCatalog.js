// Case studies of the finished client-style sites. Shape matches data.js projects; demos live in
// public/projects/<slug>/app and screenshots in assets/images/projects (tools/capture-projects.mjs).
const shot = (slug, n, alt, caption) => ({ src: `/images/projects/${slug}-${n}.webp`, alt, caption, width: 1800, height: 1125 });
const cover = (slug, alt) => ({ src: `/images/projects/${slug}-cover.webp`, alt, width: 1800, height: 1125 });
const base = { category: 'Landing Page', status: 'Personal Project · Demo version', featured: true, year: '2026' };

export const catalogProjects = [
  {
    ...base, id: 'northcut', slug: 'northcut', title: 'North Cut',
    subtitle: 'Лендинг премиального барбершопа с онлайн-записью',
    shortDescription: 'Посетитель видит услуги с ценами, выбирает мастера по его работам и оставляет заявку на удобное время — без звонка.',
    kind: 'Лендинг барбершопа',
    pitch: 'Обычный сайт-визитка превращён в путь к записи: услуги с ценой и длительностью, мастера с портфолио, галерея работ с фильтром по стилю и форма заявки с выбором услуги, мастера и времени.',
    highlights: ['Услуги с ценой и длительностью визита', 'Мастера и галерея работ с фильтром по стилю', 'Заявка: услуга, мастер, дата и контакты'],
    tags: ['Лендинг', 'Онлайн-запись', 'Галерея работ'],
    coverImage: cover('northcut', 'Первый экран лендинга North Cut'),
    gallery: [
      shot('northcut', 1, 'Услуги North Cut с ценами и длительностью', 'Услуги, цены и длительность визита'),
      shot('northcut', 2, 'Мастера North Cut с опытом и специализацией', 'Мастера и их специализация'),
      shot('northcut', 3, 'Форма записи North Cut', 'Заявка на запись без звонка')
    ],
    features: [
      { title: 'Услуги и цены', description: 'Три формата визита с прозрачной стартовой ценой и длительностью — всё понятно ещё до звонка.', screen: 'services' },
      { title: 'Мастера', description: 'Опыт, специализация и число стрижек: клиент выбирает человека, а не «свободного мастера».', screen: 'masters' },
      { title: 'Галерея работ', description: 'Работы фильтруются по стилю — fade, борода, классика, длинные волосы.', screen: 'works' },
      { title: 'Запись онлайн', description: 'Заявка с выбором услуги, мастера и даты. В демо данные никуда не отправляются.', screen: 'booking' }
    ]
  },
  {
    ...base, id: 'weekly-table', slug: 'weekly-table', title: 'WEEKLY TABLE',
    subtitle: 'Лендинг подписки на готовое питание',
    shortDescription: 'Клиент видит меню недели с КБЖУ и аллергенами, собирает тариф и сам ставит подписку на паузу — правила подписки показаны, а не спрятаны.',
    kind: 'Лендинг сервиса подписки',
    pitch: 'Главная мысль страницы — честная подписка. Пауза, замена блюд, дата списания, аллергены и отмена не описаны текстом, а работают прямо на странице.',
    highlights: ['Меню недели с КБЖУ, аллергенами и заменой блюда', 'Мокап кабинета: пауза пересчитывает дату списания', 'Конструктор тарифа с ценой на лету'],
    tags: ['Подписка', 'Конструктор тарифа', 'Кабинет клиента'],
    coverImage: cover('weekly-table', 'Первый экран лендинга WEEKLY TABLE'),
    gallery: [
      shot('weekly-table', 1, 'Меню недели WEEKLY TABLE с фильтром аллергенов', 'Меню недели, КБЖУ и аллергены'),
      shot('weekly-table', 2, 'Мокап кабинета подписки WEEKLY TABLE', 'Пауза и отмена подписки в кабинете'),
      shot('weekly-table', 3, 'Конструктор тарифа WEEKLY TABLE', 'Конструктор тарифа с ценой на лету')
    ],
    features: [
      { title: 'Меню недели', description: 'Табы дней, фильтр аллергенов, состав и КБЖУ каждого блюда, замена блюда в один клик.', screen: 'menu' },
      { title: 'Управление подпиской', description: 'Рабочий мокап кабинета: пауза недели сдвигает дату следующего списания, отмена — в два клика.', screen: 'control' },
      { title: 'Конструктор тарифа', description: 'Калорийность, цель и число приёмов пищи — цена считается сразу, без звонка менеджера.', screen: 'builder' },
      { title: 'Доставка', description: 'Проверка адреса по зонам доставки, слоты и условия.', screen: 'delivery' }
    ]
  },
  {
    ...base, id: 'verde-office', slug: 'verde-office', title: 'Verde Office',
    subtitle: 'B2B-лендинг озеленения офисов с калькулятором и КП',
    shortDescription: 'Офис-менеджер вводит параметры офиса и сразу получает смету, состав растений и готовое коммерческое предложение для согласования.',
    kind: 'B2B-лендинг с калькулятором',
    pitch: 'Сайт собирает бриф по площади и типу офиса, считает количество растений и стоимость обслуживания и формирует коммерческое предложение, которое можно переслать руководителю.',
    highlights: ['Калькулятор: площадь → растения → цена в месяц', 'План офиса прикладывается к брифу', 'КП, SLA и договор в печатной вёрстке A4'],
    tags: ['B2B', 'Калькулятор', 'Коммерческое предложение'],
    coverImage: cover('verde-office', 'Первый экран лендинга Verde Office'),
    gallery: [
      shot('verde-office', 1, 'Калькулятор озеленения Verde Office', 'Калькулятор: растения и цена в месяц'),
      shot('verde-office', 2, 'Тарифы и сервис Verde Office', 'Тарифы и состав обслуживания'),
      shot('verde-office', 3, 'Пример коммерческого предложения Verde Office', 'Коммерческое предложение в формате A4')
    ],
    features: [
      { title: 'Калькулятор', description: '200 м² → 38 растений → 24 300 ₽ в месяц: все цифры на странице считает один модуль.', screen: 'calc' },
      { title: 'План офиса', description: 'К брифу можно приложить план помещения — PDF, PNG, JPEG или DWG.', screen: 'plan' },
      { title: 'Коммерческое предложение', description: 'Готовое КП в печатной вёрстке: состав растений, график обслуживания, итоговая смета.', screen: 'kp' },
      { title: 'Гарантии сервиса', description: 'SLA по пунктам: сроки замены растений, визиты, время ответа на заявку.', screen: 'sla' }
    ]
  },
  {
    ...base, id: 'therma-home', slug: 'therma-home', title: 'Therma Home',
    subtitle: 'Лендинг с инженерным расчётом теплового насоса',
    shortDescription: 'Владелец дома отвечает на семь вопросов и получает конфигурацию системы отопления, диапазон стоимости и разбор цены по составляющим.',
    kind: 'Лендинг с калькулятором',
    pitch: 'Вопрос «сколько стоит на 150 квадратов?» превращается в квалифицированную заявку: расчёт теплопотерь, подбор мощности и честный диапазон цены. Схема дома достраивается по мере ответов.',
    highlights: ['Мастер расчёта из 7 шагов с живой схемой дома', 'Диапазон цены и разбор по составляющим', 'Стоимость владения за 10 лет против альтернатив'],
    tags: ['Калькулятор', 'Инженерный расчёт', 'Квалификация заявки'],
    coverImage: cover('therma-home', 'Первый экран лендинга Therma Home'),
    gallery: [
      shot('therma-home', 1, 'Калькулятор Therma Home со схемой дома', 'Расчёт системы и живая схема дома'),
      shot('therma-home', 2, 'Разбор цены системы Therma Home', 'Из чего складывается цена'),
      shot('therma-home', 3, 'Кейсы домов Therma Home с чертежами', 'Кейсы: что было и что поставили')
    ],
    features: [
      { title: 'Расчёт системы', description: 'Площадь, утепление, регион, контуры, горячая вода и электрика — после каждого ответа обновляются схема дома и конфигурация.', screen: 'calc' },
      { title: 'Разбор цены', description: 'Цена раскладывается на насос, ёмкости, обвязку, монтаж и проект — видно, на чём нельзя экономить.', screen: 'price' },
      { title: 'Кейсы домов', description: 'Три объекта с чертежами: что было, что поставили и сколько стоила зима.', screen: 'cases' },
      { title: 'Экономика', description: 'Стоимость владения за 10 лет: тепловой насос против электрокотла, газгольдера и дизеля.', screen: 'economy' }
    ]
  },
  {
    ...base, id: 'pawline', slug: 'pawline', title: 'PAWLINE', category: 'Web Application',
    subtitle: 'Семейный органайзер ухода за питомцем',
    shortDescription: 'Семья видит, кто уже дал лекарство и выгулял питомца, — двойная доза и пропущенные задачи исключены. Лендинг, веб-прототип и Android-приложение.',
    kind: 'Лендинг и веб-приложение',
    pitch: 'Главный вопрос семьи с питомцем — «ты уже дал таблетку?». PAWLINE отвечает на него: задачи на день с отметкой, кто и когда их выполнил, курсы лекарств и журнал здоровья.',
    highlights: ['Задачи на день с отметкой исполнителя и времени', 'Курсы лекарств с защитой от двойной дозы', 'Веб-прототип и нативное Android-приложение'],
    tags: ['Приложение', 'Семейный доступ', 'Лендинг'],
    coverImage: cover('pawline', 'Первый экран лендинга PAWLINE'),
    gallery: [
      shot('pawline', 1, 'Возможности приложения PAWLINE', 'Возможности приложения'),
      shot('pawline', 2, 'Веб-прототип PAWLINE: задачи на сегодня', 'Веб-прототип: задачи на сегодня'),
      shot('pawline', 3, 'Сценарии использования PAWLINE', 'Сценарии для семьи и ситтера')
    ],
    features: [
      { title: 'Задачи на сегодня', description: 'Веб-прототип приложения: отметьте задачу — и вся семья увидит, кто и во сколько её выполнил.', screen: 'today' },
      { title: 'Лекарства и здоровье', description: 'Курсы лекарств, журнал здоровья, напоминания и офлайн-режим.', screen: 'features' },
      { title: 'Сценарии', description: 'Как приложение работает у семьи, у ситтера и у владельца питомца с хронической болезнью.', screen: 'scenarios' },
      { title: 'Тарифы', description: 'Бесплатный план и семейный тариф — ограничения видны заранее.', screen: 'pricing' }
    ]
  },
  {
    ...base, id: 'nord-module', slug: 'nord-module', title: 'Nord Module',
    subtitle: 'Лендинг модульных домов с конфигуратором',
    shortDescription: 'Клиент собирает модуль под свою задачу — размер, фасад, остекление, террасу, инженерию — и видит точную цену, планировку и проверку проезда к участку.',
    kind: 'Лендинг с конфигуратором',
    pitch: 'Двенадцать шагов конфигуратора с правилами совместимости: несовместимые опции не прячутся, а объясняют себя. Планировки в едином масштабе с человеком и мебелью показывают реальный размер.',
    highlights: ['Конфигуратор из 12 шагов с построчной ценой', 'Планировки и сравнение масштаба с машиной и кроватью', 'Проверка проезда манипулятора к участку'],
    tags: ['Конфигуратор', 'Расчёт цены', 'Чертежи'],
    coverImage: cover('nord-module', 'Первый экран лендинга Nord Module'),
    gallery: [
      shot('nord-module', 1, 'Конфигуратор модуля Nord Module', 'Конфигуратор и цена сборки'),
      shot('nord-module', 2, 'Планировка и сравнение масштаба Nord Module', 'Реальный размер в масштабе'),
      shot('nord-module', 3, 'Проекты Nord Module с итоговыми ценами', 'Проекты и итоговые цены')
    ],
    features: [
      { title: 'Конфигуратор', description: 'Назначение, модель, фасад, остекление, терраса, интерьер и инженерия — цена пересчитывается на каждом шаге.', screen: 'configurator' },
      { title: 'Реальный размер', description: 'Планировка в масштабе и сравнение с парковочным местом, кроватью и обеденным столом.', screen: 'size' },
      { title: 'Доставка', description: 'Три вопроса о дороге к участку — и ответ, проедет ли манипулятор или понадобится кран.', screen: 'delivery' },
      { title: 'Проекты', description: 'Реальные сборки с итоговой ценой; любую можно открыть в конфигураторе и изменить.', screen: 'projects' }
    ]
  },
  {
    ...base, id: 'lumen-event', slug: 'lumen-event', title: 'Lumen Event',
    subtitle: 'Лендинг студии светового оформления событий',
    shortDescription: 'Клиент выбирает атмосферу, собирает зоны мероприятия и сразу получает moodboard, состав работ и вилку сметы с проверкой даты.',
    kind: 'Лендинг с конструктором',
    pitch: 'Выбор атмосферы перекрашивает весь сайт, включённые зоны загораются на плане площадки, а смета пересобирается на лету. Наведение на строку сметы подсвечивает зону на плане.',
    highlights: ['6 атмосфер, которые перекрашивают сайт', 'Конструктор 7 зон с планом площадки и сметой', 'Календарь занятости и moodboard по ссылке'],
    tags: ['Конструктор', 'Смета', 'Календарь'],
    coverImage: cover('lumen-event', 'Первый экран лендинга Lumen Event'),
    gallery: [
      shot('lumen-event', 1, 'Выбор атмосферы Lumen Event', 'Атмосфера перекрашивает сайт'),
      shot('lumen-event', 2, 'Конструктор зон и смета Lumen Event', 'Зоны, план площадки и смета'),
      shot('lumen-event', 3, 'Портфолио Lumen Event', 'Портфолио «днём / вечером»')
    ],
    features: [
      { title: 'Атмосфера', description: 'Шесть настроений — от тёплой свечи до неона: акценты, свечения и превью меняются сразу.', screen: 'atmosphere' },
      { title: 'Конструктор зон', description: 'Церемония, банкет, танцпол, фотозона: у каждой зоны 2–3 варианта, план площадки и смета обновляются вместе.', screen: 'constructor' },
      { title: 'Результат', description: 'Moodboard, состав работ и вилка сметы; конфигурацию можно отправить ссылкой.', screen: 'result' },
      { title: 'Портфолио', description: 'Работы с фильтрами и слайдером «днём / вечером».', screen: 'portfolio' }
    ]
  },
  {
    ...base, id: 'fixflow', slug: 'fixflow', title: 'FixFlow', category: 'Web Application',
    subtitle: 'Сайт сервиса выездного ремонта с отслеживанием заказа',
    shortDescription: 'Клиент оставляет заявку за 4 шага, выбирает свободное окно визита и следит за статусом ремонта по номеру заказа — без звонков диспетчеру.',
    kind: 'Веб-сервис',
    pitch: 'Публичный сайт работает на данных внутренней системы: свободные окна берутся из расписания мастеров, заявка становится лидом, а клиент видит ход работ по номеру заказа.',
    highlights: ['Мастер заявки из 4 шагов с черновиком', 'Свободные окна визита из расписания', 'Отслеживание заказа по номеру и телефону'],
    tags: ['Заявка онлайн', 'Расписание', 'Отслеживание заказа'],
    coverImage: cover('fixflow', 'Первый экран сайта FixFlow'),
    gallery: [
      shot('fixflow', 1, 'Как устроен ремонт в FixFlow', 'Путь заказа от заявки до гарантии'),
      shot('fixflow', 2, 'Отслеживание заказа FixFlow', 'Статус заказа по номеру'),
      shot('fixflow', 3, 'Витрина кабинета клиента FixFlow', 'Кабинет клиента')
    ],
    features: [
      { title: 'Заявка за 4 шага', description: 'Категория, описание с фото, адрес и окно визита. Черновик сохраняется, если закрыть вкладку.', screen: 'request' },
      { title: 'Отслеживание заказа', description: 'Номер заказа и 4 цифры телефона — видно, где мастер и что происходит. Попробуйте 4902 и 4417.', screen: 'track' },
      { title: 'Кабинет клиента', description: 'Витрина будущего кабинета: история заказов, сметы и гарантии.', screen: 'cabinet' },
      { title: 'Цены', description: 'Стоимость выезда и типовых работ видна до заявки.', screen: 'pricing' }
    ]
  }
];

const en = (tags, kind, subtitle, shortDescription, pitch, highlights, coverAlt, gallery, features) =>
  ({ tags, kind, subtitle, shortDescription, pitch, highlights, coverAlt, gallery, features });

export const catalogEnglish = {
  northcut: en(['Landing page', 'Online booking', 'Portfolio'], 'Barbershop landing page', 'Premium barbershop landing page with online booking',
    'Visitors see services with prices, pick a barber by their work and request a time — no phone call needed.',
    'A business-card site turned into a path to booking: services with price and duration, barbers with portfolios, a gallery filtered by style and a request form with service, barber and time.',
    ['Services with price and visit length', 'Barbers and a gallery filtered by style', 'Request: service, barber, date and contact'],
    'North Cut landing page hero',
    [{ alt: 'North Cut services with prices', caption: 'Services, prices and visit length' }, { alt: 'North Cut barbers', caption: 'Barbers and their focus' }, { alt: 'North Cut booking form', caption: 'Booking request without a call' }],
    [{ title: 'Services and prices', description: 'Three visit formats with a clear starting price and duration.' }, { title: 'Barbers', description: 'Experience, focus and cut count: clients choose a person, not “whoever is free”.' }, { title: 'Portfolio', description: 'Work filtered by style — fade, beard, classic, long hair.' }, { title: 'Online booking', description: 'Request with service, barber and date. The demo sends nothing anywhere.' }]),
  'weekly-table': en(['Subscription', 'Plan builder', 'Customer account'], 'Subscription service landing page', 'Landing page for a ready-meal subscription',
    'Customers see the weekly menu with nutrition and allergens, build a plan and pause the subscription themselves — the rules are shown, not hidden.',
    'The page is built around an honest subscription. Pausing, swapping dishes, the billing date, allergens and cancelling are not described — they work right on the page.',
    ['Weekly menu with nutrition, allergens and dish swaps', 'Account mock-up: a pause moves the billing date', 'Plan builder with live pricing'],
    'WEEKLY TABLE landing page hero',
    [{ alt: 'WEEKLY TABLE weekly menu with allergen filter', caption: 'Weekly menu, nutrition and allergens' }, { alt: 'WEEKLY TABLE subscription account mock-up', caption: 'Pause and cancel in the account' }, { alt: 'WEEKLY TABLE plan builder', caption: 'Plan builder with live pricing' }],
    [{ title: 'Weekly menu', description: 'Day tabs, allergen filter, ingredients and nutrition for every dish, one-click swaps.' }, { title: 'Subscription control', description: 'A working account mock-up: pausing a week moves the next billing date, cancelling takes two clicks.' }, { title: 'Plan builder', description: 'Calories, goal and number of meals — the price updates instantly.' }, { title: 'Delivery', description: 'Address check against delivery zones, time slots and terms.' }]),
  'verde-office': en(['B2B', 'Calculator', 'Commercial proposal'], 'B2B landing page with a calculator', 'B2B office-greening landing page with a calculator and proposal',
    'An office manager enters the office details and instantly gets an estimate, a plant list and a ready commercial proposal to share.',
    'The site collects a brief by office size and type, calculates plants and monthly service cost, and produces a proposal that can be forwarded to management.',
    ['Calculator: area → plants → monthly price', 'Office plan attached to the brief', 'Proposal, SLA and contract laid out for A4'],
    'Verde Office landing page hero',
    [{ alt: 'Verde Office greening calculator', caption: 'Calculator: plants and monthly price' }, { alt: 'Verde Office plans and service', caption: 'Plans and service scope' }, { alt: 'Verde Office sample proposal', caption: 'A4 commercial proposal' }],
    [{ title: 'Calculator', description: '200 m² → 38 plants → 24,300 ₽ a month: one module calculates every figure on the page.' }, { title: 'Office plan', description: 'A floor plan can be attached to the brief — PDF, PNG, JPEG or DWG.' }, { title: 'Commercial proposal', description: 'A print-ready proposal: plants, service schedule and total estimate.' }, { title: 'Service guarantees', description: 'An itemised SLA: plant replacement, visits and response times.' }]),
  'therma-home': en(['Calculator', 'Engineering estimate', 'Lead qualification'], 'Landing page with a calculator', 'Landing page with a heat-pump engineering estimate',
    'A homeowner answers seven questions and gets a heating system configuration, a price range and a cost breakdown.',
    '“How much for 150 square metres?” becomes a qualified lead: heat loss, sized capacity and an honest price range. The house diagram builds up as the answers come in.',
    ['7-step estimate with a live house diagram', 'Price range and cost breakdown', '10-year cost of ownership against alternatives'],
    'Therma Home landing page hero',
    [{ alt: 'Therma Home calculator with house diagram', caption: 'System estimate and live house diagram' }, { alt: 'Therma Home price breakdown', caption: 'What the price is made of' }, { alt: 'Therma Home house cases with drawings', caption: 'Cases: before and after' }],
    [{ title: 'System estimate', description: 'Area, insulation, region, heating loops, hot water and power — the diagram and configuration update after each answer.' }, { title: 'Price breakdown', description: 'Pump, tanks, piping, installation and design — and where not to save.' }, { title: 'House cases', description: 'Three houses with drawings: what was there, what was installed and what winter cost.' }, { title: 'Economics', description: '10-year cost of ownership: heat pump against electric, LPG and diesel boilers.' }]),
  pawline: en(['App', 'Family access', 'Landing page'], 'Landing page and web app', 'Family pet-care organiser',
    'The family sees who already gave the medicine and walked the pet — no double doses, no missed tasks. Landing page, web prototype and Android app.',
    'Every family with a pet asks “did you already give the pill?”. PAWLINE answers it: daily tasks marked with who did them and when, medication courses and a health log.',
    ['Daily tasks marked with who and when', 'Medication courses that prevent double doses', 'Web prototype and native Android app'],
    'PAWLINE landing page hero',
    [{ alt: 'PAWLINE app features', caption: 'App features' }, { alt: 'PAWLINE web prototype: today’s tasks', caption: 'Web prototype: today’s tasks' }, { alt: 'PAWLINE usage scenarios', caption: 'Scenarios for families and sitters' }],
    [{ title: 'Today’s tasks', description: 'A web prototype: tick a task and the whole family sees who did it and when.' }, { title: 'Medication and health', description: 'Medication courses, a health log, reminders and offline mode.' }, { title: 'Scenarios', description: 'How the app works for a family, a sitter and an owner of a chronically ill pet.' }, { title: 'Pricing', description: 'A free plan and a family plan — limits are visible upfront.' }]),
  'nord-module': en(['Configurator', 'Pricing', 'Drawings'], 'Landing page with a configurator', 'Modular-building landing page with a configurator',
    'Customers configure a module — size, cladding, glazing, terrace, utilities — and see the exact price, floor plan and an access check for their plot.',
    'Twelve configurator steps with compatibility rules: incompatible options are not hidden, they explain themselves. Floor plans share one scale with a person and furniture to show the real size.',
    ['12-step configurator with itemised pricing', 'Floor plans compared with a car and a bed', 'Crane-truck access check for the plot'],
    'Nord Module landing page hero',
    [{ alt: 'Nord Module configurator', caption: 'Configurator and build price' }, { alt: 'Nord Module floor plan and scale comparison', caption: 'Real size, to scale' }, { alt: 'Nord Module projects with final prices', caption: 'Projects and final prices' }],
    [{ title: 'Configurator', description: 'Purpose, model, cladding, glazing, terrace, interior and utilities — the price updates at every step.' }, { title: 'Real size', description: 'A to-scale plan compared with a parking space, a bed and a dining table.' }, { title: 'Delivery', description: 'Three questions about the road — and whether a crane truck gets through or a crane is needed.' }, { title: 'Projects', description: 'Real builds with final prices; open any of them in the configurator and adjust it.' }]),
  'lumen-event': en(['Configurator', 'Estimate', 'Calendar'], 'Landing page with a configurator', 'Event lighting studio landing page',
    'Clients choose a mood, assemble event zones and instantly get a moodboard, scope of work and an estimate range with a date check.',
    'Choosing a mood recolours the whole site, enabled zones light up on the venue plan and the estimate rebuilds live. Hovering an estimate line highlights its zone.',
    ['6 moods that recolour the site', '7-zone builder with venue plan and estimate', 'Availability calendar and shareable moodboard'],
    'Lumen Event landing page hero',
    [{ alt: 'Lumen Event mood selection', caption: 'The mood recolours the site' }, { alt: 'Lumen Event zone builder and estimate', caption: 'Zones, venue plan and estimate' }, { alt: 'Lumen Event portfolio', caption: 'Portfolio by day and by night' }],
    [{ title: 'Mood', description: 'Six moods, from warm candlelight to neon: accents, glows and previews change instantly.' }, { title: 'Zone builder', description: 'Ceremony, banquet, dance floor, photo zone: 2–3 options each; plan and estimate update together.' }, { title: 'Result', description: 'Moodboard, scope and estimate range; the configuration can be shared as a link.' }, { title: 'Portfolio', description: 'Work with filters and a day / night slider.' }]),
  fixflow: en(['Online request', 'Scheduling', 'Order tracking'], 'Web service', 'Field-repair service site with order tracking',
    'Customers submit a request in 4 steps, pick a free visit window and follow the repair by order number — no calls to dispatch.',
    'The public site runs on the internal system’s data: free windows come from the technicians’ schedule, the request becomes a lead and the customer follows the job by order number.',
    ['4-step request wizard with a saved draft', 'Free visit windows from the schedule', 'Order tracking by number and phone'],
    'FixFlow site hero',
    [{ alt: 'How a FixFlow repair works', caption: 'From request to warranty' }, { alt: 'FixFlow order tracking', caption: 'Order status by number' }, { alt: 'FixFlow customer account preview', caption: 'Customer account' }],
    [{ title: 'Request in 4 steps', description: 'Category, description with photos, address and visit window. The draft survives a closed tab.' }, { title: 'Order tracking', description: 'Order number and the last 4 phone digits show where the technician is. Try 4902 and 4417.' }, { title: 'Customer account', description: 'A preview of the account: order history, estimates and warranties.' }, { title: 'Prices', description: 'Call-out and typical job prices are visible before the request.' }])
};
