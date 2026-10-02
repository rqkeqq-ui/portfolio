import { catalogProjects, catalogEnglish } from './projectCatalog.js';

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
      "category": "Web Application",
      "status": "Personal Project · Demo version",
      "featured": true,
      "year": "2026",
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
      "features": [
        {
          "title": "Каталог с фильтрами и картой",
          "description": "Клиент сравнивает салоны по рейтингу, цене и ближайшему свободному окну.",
          "screen": "catalog"
        },
        {
          "title": "Онлайн-запись за минуту",
          "description": "Услуга → мастер → время. Занятое время недоступно, двойная запись исключена.",
          "screen": "booking"
        },
        {
          "title": "Личный кабинет клиента",
          "description": "Все визиты в одном месте: дата, мастер, стоимость и отмена в один клик.",
          "screen": "account"
        },
        {
          "title": "Кабинет владельца салона",
          "description": "Записи на сегодня, выручка за неделю, график мастеров и управление услугами.",
          "screen": "owner"
        }
      ],
      "githubUrl": "https://github.com/rqkeqq-ui/beauty-booking",
      "tags": [
        "Онлайн-запись",
        "Расписание",
        "Кабинеты"
      ],
      "kind": "Веб-сервис онлайн-записи",
      "pitch": "Клиенты сами находят салон и записываются к мастеру на свободное время — без звонков и переписок. Владелец видит записи, расписание и выручку в одном кабинете.",
      "highlights": [
        "Каталог салонов с фильтрами по услуге, цене и району",
        "Запись в три шага: услуга, мастер, время",
        "Кабинет салона: записи, график мастеров, услуги"
      ]
    },
    {
      "id": "library-system",
      "slug": "library-system",
      "title": "Library Management System",
      "subtitle": "Каталог и учёт выдачи книг",
      "shortDescription": "Читатель находит и бронирует книгу. Сотрудник обрабатывает заявки, выдачу, возврат и продление в одной системе.",
      "category": "Web Application",
      "status": "Personal Project",
      "featured": true,
      "year": "2026",
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
      "features": [
        {
          "title": "Каталог и поиск",
          "description": "Читатель находит книгу по названию, автору или жанру и сразу видит, есть ли она в наличии.",
          "screen": "catalog"
        },
        {
          "title": "Бронирование онлайн",
          "description": "Заявка в один клик, статус виден в личном кабинете читателя.",
          "screen": "booking"
        },
        {
          "title": "Мои книги",
          "description": "Сроки возврата и продление без визита в библиотеку.",
          "screen": "mybooks"
        },
        {
          "title": "Панель библиотекаря",
          "description": "Новые заявки, выданные книги, просрочки и пополнение фонда.",
          "screen": "admin"
        }
      ],
      "liveUrl": "https://library-system-rqke.freehosting.dev",
      "githubUrl": "https://github.com/rqkeqq-ui/library-system",
      "tags": [
        "Каталог",
        "Заявки",
        "Учёт"
      ],
      "kind": "Система для библиотеки",
      "pitch": "Читатель находит книгу и бронирует её онлайн, а библиотекарь обрабатывает заявки, выдачу и возврат в одной системе — вместо журналов и таблиц.",
      "highlights": [
        "Каталог с поиском по названию, автору и жанру",
        "Онлайн-бронирование и статус заявки",
        "Панель библиотекаря: выдача, возврат, продление"
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
    "features": [
      {
        "title": "Catalogue with filters and map",
        "description": "Customers compare salons by rating, price and the next free slot."
      },
      {
        "title": "Booking in a minute",
        "description": "Service → specialist → time. Taken slots are unavailable, so double bookings can’t happen."
      },
      {
        "title": "Customer account",
        "description": "Every visit in one place: date, specialist, price and one-click cancellation."
      },
      {
        "title": "Salon owner workspace",
        "description": "Today’s bookings, weekly revenue, staff schedules and service management."
      }
    ],
    "tags": [
      "Online booking",
      "Schedules",
      "Workspaces"
    ],
    "kind": "Online booking service",
    "pitch": "Customers find a salon and book a specialist’s free time on their own — no calls or messages. The owner sees bookings, schedules and revenue in one workspace.",
    "highlights": [
      "Salon catalogue filtered by service, price and district",
      "Booking in three steps: service, specialist, time",
      "Salon workspace: bookings, staff schedules, services"
    ]
  },
  "library-system": {
    "subtitle": "Book catalogue and lending management",
    "shortDescription": "Readers find and reserve books. Staff handle requests, lending, returns and renewals in one system.",
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
    "features": [
      {
        "title": "Catalogue and search",
        "description": "Readers find a book by title, author or genre and see right away whether it is available."
      },
      {
        "title": "Online reservations",
        "description": "One-click requests with status tracking in the reader account."
      },
      {
        "title": "My books",
        "description": "Return dates and renewals without visiting the library."
      },
      {
        "title": "Librarian panel",
        "description": "New requests, books on loan, overdue items and new additions to the stock."
      }
    ],
    "tags": [
      "Catalogue",
      "Requests",
      "Records"
    ],
    "kind": "Library management system",
    "pitch": "Readers find and reserve books online, while the librarian handles requests, lending and returns in one system instead of logbooks and spreadsheets.",
    "highlights": [
      "Catalogue search by title, author and genre",
      "Online reservations with request status",
      "Librarian panel: lending, returns, renewals"
    ]
  }
};
  // Library goes last: BeautyBook, the finished client sites, then the library system.
  Object.assign(english, catalogEnglish);
  {
    const [beauty, library] = ['beauty-booking', 'library-system'].map(slug => source.projects.find(project => project.slug === slug));
    source.projects = [beauty, ...catalogProjects, library];
  }
  const categoryRu = {'Landing Page':'Лендинг','Business Website':'Бизнес-сайт','Web Application':'Веб-приложение','AI Automation':'AI-автоматизация','AI Agent':'AI-агент'};
  const statusRu = {'Personal Project · Demo version':'Личный проект · Демонстрационная версия','Commercial Project':'Коммерческий проект','Personal Project':'Личный проект','Concept':'Концепт','In Development':'В разработке'};
  function localizeProject(project, language) {
    if (language !== 'en') return structuredClone(project);
    const text = english[project.slug];
    if (!text) return structuredClone(project);
    const next = structuredClone(project);
    next.tags = text.tags; next.kind = text.kind; next.pitch = text.pitch; next.highlights = text.highlights;
    next.subtitle = text.subtitle; next.shortDescription = text.shortDescription;
    next.coverImage.alt = text.coverAlt;
    next.gallery = next.gallery.map((image, index) => ({...image, ...(text.gallery[index] || {})}));
    next.features = next.features.map((feature, index) => ({...feature, ...(text.features[index] || {})}));
    return next;
  }
  const formatCategory = (value, language) => language === 'ru' ? (categoryRu[value] || value) : value;
  const formatStatus = (value, language) => language === 'ru' ? (statusRu[value] || value) : value;
  export const RQKE_DATA = {...source, localizeProject, formatCategory, formatStatus};
