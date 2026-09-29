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
      "subtitle": "Платформа поиска салонов, онлайн-записи и управления операциями",
      "shortDescription": "Цифровой продукт для поиска салонов, записи клиентов и управления операциями.",
      "fullDescription": "Платформа объединяет публичный каталог салонов, транзакционную запись к специалистам, личный кабинет клиента, рабочее пространство владельца и административный контур.",
      "category": "Web Application",
      "status": "Personal Project",
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
      "result": "Реализован полный демонстрационный цикл сервиса: от поиска салона и записи клиента до управления расписанием владельцем и super-admin операций.",
      "futureFeatures": [
        "Production-платежи",
        "Расширенная аналитика салона",
        "Постоянный production-hosting",
        "Push-уведомления"
      ],
      "githubUrl": "https://github.com/rqkeqq-ui/beauty-booking"
    },
    {
      "id": "library-system",
      "slug": "library-system",
      "title": "Library Management System",
      "subtitle": "Веб-сервис для каталога, бронирований и библиотечных операций",
      "shortDescription": "Цифровая система для каталога, бронирований, выдачи книг и работы администратора.",
      "fullDescription": "Система для одной библиотеки: пользователь ищет и бронирует книги, следит за своими заявками, а администратор обрабатывает выдачу, возврат и продление.",
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
      "result": "Проект позволил пройти полный цикл классического веб-приложения: схема данных, авторизация, пользовательский интерфейс и административная панель.",
      "futureFeatures": [
        "Автоматические тесты",
        "CI",
        "Поддержка нескольких филиалов",
        "Уведомления читателей"
      ],
      "liveUrl": "https://library-system-rqke.freehosting.dev",
      "githubUrl": "https://github.com/rqkeqq-ui/library-system"
    }
  ]
};
  const english = {
  "beauty-booking": {
    "subtitle": "A platform for salon discovery, online booking and operations management",
    "shortDescription": "A digital product for salon discovery, customer booking and day-to-day operations.",
    "fullDescription": "The platform connects a public salon catalogue, transactional specialist booking, a customer account, an owner workspace and an administrative layer.",
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
    "result": "The complete demonstration cycle is implemented: from salon discovery and customer booking to schedule management by the owner and super-admin operations.",
    "futureFeatures": [
      "Production payments",
      "Advanced salon analytics",
      "Persistent production hosting",
      "Push notifications"
    ]
  },
  "library-system": {
    "subtitle": "A web service for catalogue, reservations and library operations",
    "shortDescription": "A digital system for the catalogue, reservations, lending and administrator workflow.",
    "fullDescription": "A system for a single library: readers search and reserve books and track their requests, while administrators handle issue, return and renewal operations.",
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
    "result": "The project covers the complete cycle of a classic web application: data schema, authentication, reader interface and administration panel.",
    "futureFeatures": [
      "Automated tests",
      "Continuous integration",
      "Multiple library branches",
      "Reader notifications"
    ]
  }
};
  const categoryRu = {'Landing Page':'Лендинг','Business Website':'Бизнес-сайт','Web Application':'Веб-приложение','AI Automation':'AI-автоматизация','AI Agent':'AI-агент'};
  const statusRu = {'Commercial Project':'Коммерческий проект','Personal Project':'Личный проект','Concept':'Концепт','In Development':'В разработке'};
  function localizeProject(project, language) {
    if (language !== 'en') return structuredClone(project);
    const text = english[project.slug];
    if (!text) return structuredClone(project);
    const next = structuredClone(project);
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
