  const source = {
  "links": [
    {
      "id": "github",
      "label": "GitHub",
      "url": "https://github.com/rqkeqq-ui",
      "note": "Код и репозитории"
    },
    {
      "id": "telegram",
      "label": "Telegram",
      "url": "https://t.me/lqkeee",
      "note": "Быстрый контакт"
    }
  ],
  "projects": [
    {
      "id": "beauty-booking",
      "slug": "beauty-booking",
      "title": "BeautyBook",
      "subtitle": "Онлайн-запись и управление расписанием салона",
      "shortDescription": "Клиент выбирает услугу, специалиста и свободное время. Владелец управляет расписанием, сотрудниками и записями.",
      "fullDescription": "Демонстрационный сервис для поиска салонов и онлайн-записи. Клиент выбирает услугу, специалиста и доступное время. В кабинете салона можно управлять сотрудниками, услугами и расписанием.",
      "category": "Web Application",
      "status": "Personal Project · Demo version",
      "featured": true,
      "year": "2026",
      "role": "Product Design & Development",
      "coverImage": {
        "src": "/images/projects/beauty-landing.webp",
        "alt": "Главная страница платформы BeautyBook",
        "width": 1800,
        "height": 919
      },
      "gallery": [
        {
          "src": "/images/projects/beauty-search.webp",
          "alt": "Каталог салонов BeautyBook с поиском и фильтрами",
          "caption": "Каталог, фильтры и карта",
          "width": 1667,
          "height": 1272
        },
        {
          "src": "/images/projects/beauty-booking.webp",
          "alt": "Сценарий бронирования услуги в BeautyBook",
          "caption": "Выбор услуги, специалиста и доступного времени",
          "width": 1448,
          "height": 1086
        },
        {
          "src": "/images/projects/beauty-dashboard.webp",
          "alt": "Панель владельца салона BeautyBook",
          "caption": "Операционная панель салона",
          "width": 1448,
          "height": 1086
        }
      ],
      "goals": [
        "Собрать поиск и выбор салона в одном понятном сценарии",
        "Рассчитывать свободное время с учётом графиков и занятых слотов",
        "Разделить клиентские, салонные и административные права",
        "Защитить бронирование от конфликтов на уровне транзакции"
      ],
      "features": [
        {
          "title": "Поиск и каталог",
          "description": "Каталог салонов, фильтры, профили, координаты на карте, рейтинги и отзывы."
        },
        {
          "title": "Запись без конфликтов",
          "description": "Выбор услуги, специалиста и времени; повторное бронирование одного слота блокируется транзакционно."
        },
        {
          "title": "Роли и кабинеты",
          "description": "JWT access/refresh-сессии, маршруты клиента, владельца салона и super-admin."
        },
        {
          "title": "Управление салоном",
          "description": "Бронирования, услуги, специалисты, рабочие часы, блокировки времени и сводные метрики."
        }
      ],
      "challenges": [
        {
          "title": "Расчёт доступности",
          "problem": "Свободный слот зависит от графика специалиста, блокировок и уже созданных записей.",
          "solution": "Расчёт вынесен в API, результаты кэшируются в Redis с in-memory fallback.",
          "result": "Единая логика доступности используется в пользовательском сценарии и защищена тестами."
        },
        {
          "title": "Конкурирующие записи",
          "problem": "Два запроса могут попытаться занять одно и то же время.",
          "solution": "Проверка и создание записи выполняются в транзакционной серверной операции.",
          "result": "Дубликаты предотвращаются не только интерфейсом, но и backend-правилами."
        }
      ],
      "stack": [
        "Next.js",
        "React",
        "TypeScript",
        "Express 5",
        "PostgreSQL",
        "Prisma",
        "Redis",
        "Vitest",
        "Docker Compose"
      ],
      "architecture": [
        {
          "title": "Client interface",
          "description": "Next.js приложение и ролевые пользовательские сценарии"
        },
        {
          "title": "API layer",
          "description": "Express 5, бизнес-правила, JWT и OpenAPI"
        },
        {
          "title": "Data layer",
          "description": "PostgreSQL через Prisma ORM"
        },
        {
          "title": "Cache",
          "description": "Redis с резервным in-memory режимом"
        }
      ],
      "result": "Реализован сценарий от поиска салона и записи клиента до обработки записей владельцем. Проверка занятости времени предусмотрена в серверной логике.",
      "futureFeatures": [
        "Production-платежи",
        "Расширенная аналитика салона",
        "Постоянный production-hosting",
        "Push-уведомления"
      ],
      "githubUrl": "https://github.com/rqkeqq-ui/beauty-booking",
      "task": "Соединить выбор салона, запись клиента и управление расписанием в одном продукте. Важно, чтобы доступное время учитывало график специалиста и уже созданные записи.",
      "limitations": "Это личный демонстрационный проект. Приём реальных платежей и постоянный production-хостинг не входят в текущую версию.",
      "scenario": [
        "Клиент находит салон и выбирает услугу.",
        "Выбирает специалиста и доступное время с учётом расписания.",
        "Создаёт запись и просматривает её в своём кабинете.",
        "Владелец управляет записями, сотрудниками и расписанием."
      ],
      "tags": [
        "Онлайн-запись",
        "Расписание",
        "Кабинеты"
      ]
    },
    {
      "id": "library-system",
      "slug": "library-system",
      "title": "Library Management System",
      "subtitle": "Каталог и учёт выдачи книг",
      "shortDescription": "Читатель находит и бронирует книгу. Сотрудник обрабатывает заявки, выдачу, возврат и продление в одной системе.",
      "fullDescription": "Сервис для одной библиотеки. Читатель ищет книги, создаёт бронирование и следит за заявками. Сотрудник ведёт каталог и обрабатывает выдачу, возврат и продление.",
      "category": "Web Application",
      "status": "Personal Project",
      "featured": true,
      "year": "2026",
      "role": "Architecture & Development",
      "coverImage": {
        "src": "/images/projects/library-banner.webp",
        "alt": "Баннер Library Management System",
        "width": 1800,
        "height": 600
      },
      "gallery": [
        {
          "src": "/images/projects/library-catalog.webp",
          "alt": "Каталог книг Library Management System",
          "caption": "Каталог и быстрый поиск",
          "width": 1800,
          "height": 1013
        },
        {
          "src": "/images/projects/library-admin.webp",
          "alt": "Панель обработки заявок библиотекарем",
          "caption": "Выдача, возврат и обработка заявок",
          "width": 1800,
          "height": 1013
        },
        {
          "src": "/images/projects/library-books.webp",
          "alt": "Управление книгами в административной панели",
          "caption": "Добавление книг администратором",
          "width": 1800,
          "height": 1013
        }
      ],
      "goals": [
        "Реализовать регистрацию и ролевой доступ",
        "Упростить поиск книг в каталоге",
        "Перенести заявки, выдачу и возврат в одну систему",
        "Дать читателю историю книг и бронирований"
      ],
      "features": [
        {
          "title": "Авторизация",
          "description": "Регистрация, вход и разделение ролей пользователя и администратора."
        },
        {
          "title": "Каталог",
          "description": "Каталог книг, быстрый поиск и карточка книги."
        },
        {
          "title": "Бронирование",
          "description": "Создание заявки и отслеживание её состояния в личном кабинете."
        },
        {
          "title": "Админ-панель",
          "description": "Добавление книг, обработка заявок, выдача, возврат и продление."
        }
      ],
      "challenges": [
        {
          "title": "Ролевые сценарии",
          "problem": "Читателю и администратору нужны разные действия над общими данными.",
          "solution": "Права и интерфейсы разделены на PHP-маршрутах, операции с БД выполнены через PDO.",
          "result": "Получился связный сценарий от заявки читателя до обработки библиотекарем."
        }
      ],
      "stack": [
        "PHP 8",
        "MySQL",
        "HTML5",
        "CSS3",
        "Vanilla JavaScript",
        "Apache",
        "PDO"
      ],
      "architecture": [
        {
          "title": "Browser",
          "description": "HTML/CSS и Vanilla JavaScript"
        },
        {
          "title": "Application",
          "description": "PHP 8 страницы и API-обработчики"
        },
        {
          "title": "Data",
          "description": "MySQL, подключение через PDO"
        }
      ],
      "result": "Реализованы поиск и бронирование книг, история заявок и административные операции с каталогом и выдачей.",
      "futureFeatures": [
        "Автоматические тесты",
        "CI",
        "Поддержка нескольких филиалов",
        "Уведомления читателей"
      ],
      "liveUrl": "https://library-system-rqke.freehosting.dev",
      "githubUrl": "https://github.com/rqkeqq-ui/library-system",
      "task": "Собрать каталог, бронирование и работу сотрудника с заявками в одной системе, разделив действия читателя и администратора.",
      "limitations": "Это личный проект для одной библиотеки. Поддержка нескольких филиалов, уведомления и автоматические тесты обозначены как следующие этапы.",
      "scenario": [
        "Читатель находит книгу в каталоге.",
        "Создаёт бронирование и следит за статусом заявки.",
        "Сотрудник обрабатывает заявку и выдаёт книгу.",
        "Возврат и продление учитываются в той же системе."
      ],
      "tags": [
        "Каталог",
        "Заявки",
        "Учёт"
      ]
    }
  ],
  "booking": {
    "provider": "calcom",
    "bookingUrl": "https://cal.com/%D0%B4%D0%B6%D0%B5%D0%B8%D0%BA-%D1%80%D1%83%D0%BA-be4bgy/30min",
    "calLink": "джеик-рук-be4bgy/30min",
    "durationMinutes": 30,
    "timeZone": "Asia/Barnaul",
    "availability": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "13:00",
      "end": "20:00"
    }
  }
};
  const english = {
  "beauty-booking": {
    "subtitle": "Online booking and salon schedule management",
    "shortDescription": "Customers choose a service, specialist and available time. Owners manage schedules, staff and bookings.",
    "fullDescription": "A demo service for salon discovery and online booking. Customers choose a service, specialist and available time. Salon owners manage staff, services and schedules in their workspace.",
    "coverAlt": "BeautyBook platform homepage",
    "gallery": [
      {
        "alt": "BeautyBook salon catalogue with search and filters",
        "caption": "Catalogue, filters and map"
      },
      {
        "alt": "BeautyBook service booking flow",
        "caption": "Service, specialist and available-time selection"
      },
      {
        "alt": "BeautyBook salon owner dashboard",
        "caption": "Salon operations dashboard"
      }
    ],
    "goals": [
      "Unify salon discovery and selection in one clear journey",
      "Calculate availability from schedules and occupied time slots",
      "Separate customer, salon and administrative permissions",
      "Prevent booking conflicts at the transaction level"
    ],
    "features": [
      {
        "title": "Search and catalogue",
        "description": "Salon catalogue, filters, profiles, map coordinates, ratings and reviews."
      },
      {
        "title": "Conflict-free booking",
        "description": "Service, specialist and time selection with transactional protection against duplicate bookings."
      },
      {
        "title": "Roles and workspaces",
        "description": "JWT access and refresh sessions with customer, salon owner and super-admin routes."
      },
      {
        "title": "Salon management",
        "description": "Bookings, services, specialists, working hours, blocked time and summary metrics."
      }
    ],
    "challenges": [
      {
        "title": "Availability calculation",
        "problem": "An available slot depends on specialist schedules, blocked periods and existing bookings.",
        "solution": "The calculation lives in the API and is cached in Redis with an in-memory fallback.",
        "result": "One availability rule powers the customer journey and is covered by tests."
      },
      {
        "title": "Concurrent bookings",
        "problem": "Two requests may try to reserve the same time slot.",
        "solution": "Validation and booking creation run inside one transactional server operation.",
        "result": "Duplicates are prevented by backend rules, not only by the interface."
      }
    ],
    "architecture": [
      {
        "title": "Client interface",
        "description": "Next.js application and role-based user journeys"
      },
      {
        "title": "API layer",
        "description": "Express 5, business rules, JWT and OpenAPI"
      },
      {
        "title": "Data layer",
        "description": "PostgreSQL through Prisma ORM"
      },
      {
        "title": "Cache",
        "description": "Redis with an in-memory fallback"
      }
    ],
    "result": "The journey from salon discovery and customer booking to owner booking management is implemented. Server-side logic checks occupied time.",
    "futureFeatures": [
      "Production payments",
      "Advanced salon analytics",
      "Persistent production hosting",
      "Push notifications"
    ],
    "task": "Connect salon selection, customer booking and schedule management in one product. Availability must account for specialist schedules and existing bookings.",
    "limitations": "This is a personal demonstration project. Real payments and persistent production hosting are outside the current version.",
    "scenario": [
      "Find a salon and choose a service.",
      "Choose a specialist and an available time based on their schedule.",
      "Create a booking and view it in the customer account.",
      "The owner manages bookings, staff and schedules."
    ],
    "tags": [
      "Online booking",
      "Schedules",
      "Workspaces"
    ]
  },
  "library-system": {
    "subtitle": "Book catalogue and lending management",
    "shortDescription": "Readers find and reserve books. Staff handle requests, lending, returns and renewals in one system.",
    "fullDescription": "A service for one library. Readers search for books, create reservations and track requests. Staff maintain the catalogue and handle lending, returns and renewals.",
    "coverAlt": "Library Management System banner",
    "gallery": [
      {
        "alt": "Library Management System book catalogue",
        "caption": "Catalogue and quick search"
      },
      {
        "alt": "Librarian request processing dashboard",
        "caption": "Issue, return and request processing"
      },
      {
        "alt": "Book management in the admin panel",
        "caption": "Adding books as an administrator"
      }
    ],
    "goals": [
      "Implement registration and role-based access",
      "Simplify book discovery in the catalogue",
      "Move requests, issue and return into one system",
      "Give readers a history of books and reservations"
    ],
    "features": [
      {
        "title": "Authentication",
        "description": "Registration, sign-in and separate reader and administrator roles."
      },
      {
        "title": "Catalogue",
        "description": "Book catalogue, quick search and individual book pages."
      },
      {
        "title": "Reservations",
        "description": "Request creation and status tracking in the reader account."
      },
      {
        "title": "Admin panel",
        "description": "Book management, request processing, issue, return and renewal."
      }
    ],
    "challenges": [
      {
        "title": "Role-based journeys",
        "problem": "Readers and administrators need different actions over shared data.",
        "solution": "Permissions and interfaces are separated at the PHP route level; database operations use PDO.",
        "result": "The system connects a reader request to librarian processing in one coherent journey."
      }
    ],
    "architecture": [
      {
        "title": "Browser",
        "description": "HTML/CSS and Vanilla JavaScript"
      },
      {
        "title": "Application",
        "description": "PHP 8 pages and API handlers"
      },
      {
        "title": "Data",
        "description": "MySQL through PDO"
      }
    ],
    "result": "Book search and reservations, request history, and administrative catalogue and lending operations are implemented.",
    "futureFeatures": [
      "Automated tests",
      "Continuous integration",
      "Multiple library branches",
      "Reader notifications"
    ],
    "task": "Bring the catalogue, reservations and staff request processing into one system, separating reader and administrator actions.",
    "limitations": "A personal project for one library. Multiple branches, notifications and automated tests are planned next steps.",
    "scenario": [
      "Find a book in the catalogue.",
      "Create a reservation and track its status.",
      "Staff process the request and lend the book.",
      "Returns and renewals are recorded in the same system."
    ],
    "tags": [
      "Catalogue",
      "Requests",
      "Records"
    ]
  }
};
  const categoryRu = {'Landing Page':'Лендинг','Business Website':'Бизнес-сайт','Web Application':'Веб-приложение','AI Automation':'AI-автоматизация','AI Agent':'AI-агент'};
  const statusRu = {'Personal Project · Demo version':'Личный проект · Демонстрационная версия','Commercial Project':'Коммерческий проект','Personal Project':'Личный проект','Concept':'Концепт','In Development':'В разработке'};
  function localizeProject(project, language) {
    if (language !== 'en') return structuredClone(project);
    const text = english[project.slug];
    if (!text) return structuredClone(project);
    const next = structuredClone(project);
    next.task = text.task; next.scenario = text.scenario; next.limitations = text.limitations; next.tags = text.tags;
    next.subtitle = text.subtitle; next.shortDescription = text.shortDescription; next.fullDescription = text.fullDescription;
    next.coverImage.alt = text.coverAlt;
    next.gallery = next.gallery.map((image, index) => ({...image, ...(text.gallery[index] || {})}));
    next.goals = text.goals; next.features = text.features; next.challenges = text.challenges; next.architecture = text.architecture; next.result = text.result; next.futureFeatures = text.futureFeatures;
    return next;
  }
  const formatCategory = (value, language) => language === 'ru' ? (categoryRu[value] || value) : value;
  const formatStatus = (value, language) => language === 'ru' ? (statusRu[value] || value) : value;
  const formatRole = (value, language) => language === 'ru' ? value.replace('Product Design & Development','Проектирование продукта и разработка').replace('Architecture & Development','Архитектура и разработка') : value;
  export const RQKE_DATA = {...source, localizeProject, formatCategory, formatStatus, formatRole};
