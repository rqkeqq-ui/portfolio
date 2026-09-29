import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';

(() => {
  'use strict';

  // Keep the mobile layout tied to the *visual* viewport as well as CSS media
  // queries. Chrome device emulation and some mobile browsers can expose a
  // wider layout viewport while the visible viewport is phone-sized.
  const syncForcedMobileLayout = () => {
    const widths = [
      window.innerWidth,
      document.documentElement.clientWidth,
      window.visualViewport?.width,
      window.screen?.width,
    ].filter(value => Number.isFinite(value) && value > 0);
    const visualWidth = Math.min(...widths);
    document.documentElement.classList.toggle('rqke-force-mobile', visualWidth <= 767);
  };
  syncForcedMobileLayout();
  window.visualViewport?.addEventListener('resize', syncForcedMobileLayout, { passive: true });
  window.addEventListener('resize', syncForcedMobileLayout, { passive: true });
const dictionary = {
  ru: {
    navigation: [
      ["home", "Главная"],
      ["about", "Подход"],
      ["projects", "Проекты"],
      ["overview", "Возможности"],
      ["services", "Направления"],
      ["testimonial", "Совместная работа"],
      ["faq", "FAQ"],
    ],
    navLabel: "Навигация по главной странице",
    railLabel: "Информация и навигация rqke",
    homeLabel: "rqke / SYSTEMS — к началу страницы",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    language: "Переключить язык на английский",
    intro: "ЗАДАЧА / АРХИТЕКТУРА / РЕЗУЛЬТАТ",
    railText: "Создаю цифровые продукты и системы, которые решают реальные задачи бизнеса.",
    railCta: "Обсудить задачу",
    heroKicker: "РАЗРАБОТЧИК ЦИФРОВЫХ РЕШЕНИЙ / 2026",
    heroTitle: "Превращаю идеи",
    heroAccent: "в&nbsp;работающие цифровые решения.",
    heroText: "От понимания задачи и архитектуры — до разработки, запуска и готового результата.",
    viewProjects: "Смотреть проекты",
    discussProject: "Обсудить проект",
    traits: ["Задача и контекст", "Архитектура решения", "Качество реализации", "Готовый результат"],
    approachEyebrow: "01 / ПОДХОД",
    approachTitle: "От задачи —<br>к&nbsp;работающему<br>продукту",
    approachLead: "Сначала определяю реальную задачу бизнеса. Затем проектирую сценарии, архитектуру и реализацию как одну систему с проверяемым результатом.",
    journeyLabel: "ПЯТЬ ЭТАПОВ / ОДИН КОНТЕКСТ",
    details: "Подробнее",
    closeDetails: "Закрыть подробное описание",
    stage: "этап",
    journey: [
      { marker: "01", label: "КОНТЕКСТ", title: "Цель и критерии", summary: "Фиксирую проблему, аудиторию, ограничения и измеримый результат первой версии.", detail: "Работа начинается не со списка экранов, а с бизнес-задачи. Мы определяем ключевой сценарий, границы первой версии и признаки того, что решение действительно работает." },
      { marker: "02", label: "АРХИТЕКТУРА", title: "Сценарии и данные", summary: "Собираю пользовательские пути, роли, сущности и интеграции в понятную схему.", detail: "Карта сценариев, модель данных и технические зависимости проектируются вместе. Это сокращает переделки и делает будущие изменения предсказуемыми." },
      { marker: "03", label: "ИНТЕРФЕЙС", title: "Понятная форма", summary: "Выстраиваю иерархию и визуальную систему вокруг действий пользователя.", detail: "Прототип и дизайн объясняют продукт без лишнего декора. Каждый экран отвечает на вопрос пользователя и ведёт к следующему действию." },
      { marker: "04", label: "РАЗРАБОТКА", title: "Решение в коде", summary: "Соединяю интерфейс, логику, данные и интеграции в рабочий продукт.", detail: "Функции собираются короткими проверяемыми этапами. Интерфейс и серверная логика тестируются вместе, поэтому итог не расходится с согласованным сценарием." },
      { marker: "05", label: "ЗАПУСК", title: "Контроль и развитие", summary: "Проверяю ключевые пути, передаю управление и оставляю основу для следующей версии.", detail: "Перед запуском проверяются адаптивность, доступность, данные и инфраструктура. Контент остаётся управляемым, а архитектура — готовой к развитию." },
    ],
    overviewEyebrow: "03 / ВОЗМОЖНОСТИ",
    overviewTitle: "Что получает бизнес",
    overviewLead: "Не коллекцию экранов, а инструмент под конкретный процесс: понятный пользователю, управляемый внутри и готовый к развитию.",
    capabilities: [
      ["01", "Ясный сценарий", "Пользователь понимает ценность и следующее действие без долгого изучения интерфейса."],
      ["02", "Рабочий продукт", "Сценарии, роли, данные и интеграции работают как одно целое."],
      ["03", "Меньше ручной работы", "Повторяемые операции автоматизированы там, где это действительно экономит время."],
      ["04", "Основа для роста", "Контент, архитектура и документация не требуют пересобирать проект при каждом изменении."],
    ],
    servicesEyebrow: "04 / НАПРАВЛЕНИЯ",
    servicesTitle: "Формат продукта следует за задачей",
    servicesLead: "Решим конкретную проблему бизнеса и превратим её в рабочий цифровой продукт, который помогает увеличивать выручку, экономить время или снижать издержки. Начнём с точной первой версии и будем развивать её по реальным данным.",
    discussDirection: "Обсудить направление",
    services: [
      { number: "01", label: "WEBSITES", title: "Сайты", description: "Цифровая точка контакта, которая ясно объясняет предложение и приводит клиента к нужному действию.", items: ["Корпоративные сайты", "Продуктовые страницы", "Лендинги", "Контентная система"] },
      { number: "02", label: "DIGITAL SYSTEMS", title: "Цифровые системы", description: "Управляемый рабочий контур для процессов, ролей и операций внутри бизнеса.", items: ["Личные кабинеты", "Операционные панели", "Управление ролями", "Рабочие процессы"] },
      { number: "03", label: "WEB APPLICATIONS", title: "Веб-приложения", description: "Полноценные продукты с бизнес-логикой, данными и завершёнными пользовательскими сценариями.", items: ["MVP и сервисы", "Клиентские платформы", "Каталоги и бронирование", "Логика продукта"] },
      { number: "04", label: "AUTOMATION", title: "Автоматизация", description: "Связываю данные и операции, чтобы сократить рутину и сделать процесс контролируемым.", items: ["Связь сервисов", "Обработка данных", "Сокращение рутины", "Контроль операций"] },
    ],
    principleEyebrow: "05 / ПРИНЦИП",
    principleLines: ["Архитектура продукта", "× инженерная точность", "× качественная разработка"],
    principleSummary: "Структура. Логика. Качество.",
    startConversation: "Начать разговор",
    proofEyebrow: "06 / СОВМЕСТНАЯ РАБОТА",
    proofTitle: "Прозрачный процесс, проверяемый результат",
    proofLabel: "Принципы совместной работы",
    previousProof: "Предыдущий принцип",
    nextProof: "Следующий принцип",
    proofSlides: [
      { index: "01", title: "Один контекст на всём пути", text: "Структура, визуальный язык и код принимаются как части одного продукта, а не передаются по цепочке между разными исполнителями.", meta: "ПРОДУКТ / ДИЗАЙН / РАЗРАБОТКА" },
      { index: "02", title: "Прогресс можно увидеть", text: "Рабочие срезы и ограничения обсуждаются до того, как решения становятся дорогими и сложными для замены.", meta: "КОРОТКИЕ ИТЕРАЦИИ / ОБРАТНАЯ СВЯЗЬ" },
      { index: "03", title: "Управление остаётся у вас", text: "Контент, данные и ключевые операции получают понятный административный контур и путь дальнейшего развития.", meta: "ПЕРЕДАЧА / КОНТРОЛЬ / РАЗВИТИЕ" },
    ],
    faqEyebrow: "07 / FAQ",
    faqTitle: "Коротко до старта",
    faq: [
      ["Как начинается работа?", "С короткого контекста: задача, аудитория, существующие материалы и критерий результата. После этого я предлагаю формат и границы первой версии."],
      ["Можно начать с небольшой версии?", "Да. Рабочее ядро обычно полезнее большого списка функций. Первая версия проектируется так, чтобы следующий этап не требовал начинать заново."],
      ["Дизайн входит в разработку?", "Да. Структура, UX и визуальное направление рассматриваются как части одного решения."],
      ["Можно доработать существующий проект?", "Да, после аудита кода, данных и инфраструктуры. Затем определяем, что безопасно развивать, а что лучше заменить."],
      ["Что происходит после запуска?", "Проверяются реальные сценарии и инфраструктура. Дальше возможна поддержка, следующий этап или передача с документацией."],
      ["Как оценить срок и бюджет?", "Опишите задачу, желаемый результат и ограничения. В ответ я предложу реалистичный первый контур и вопросы для точной оценки."],
    ],
    backToTop: "Вернуться к началу страницы",
  },
  en: {
    navigation: [["home", "Home"], ["about", "Approach"], ["projects", "Projects"], ["overview", "Outcomes"], ["services", "Services"], ["testimonial", "Collaboration"], ["faq", "FAQ"]],
    navLabel: "Homepage navigation",
    railLabel: "rqke information and navigation",
    homeLabel: "rqke / SYSTEMS — back to top",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Switch language to Russian",
    intro: "PROBLEM / ARCHITECTURE / RESULT",
    railText: "I build digital products and systems that solve real business problems.",
    railCta: "Discuss a project",
    heroKicker: "INDEPENDENT DEVELOPER / 2026",
    heroTitle: "Turning ideas into",
    heroAccent: "digital solutions that work.",
    heroText: "From understanding the problem and defining the architecture to development, launch and a complete result.",
    viewProjects: "View projects",
    discussProject: "Discuss a project",
    traits: ["Problem and context", "Solution architecture", "Quality of execution", "Complete result"],
    approachEyebrow: "01 / APPROACH",
    approachTitle: "From problem to<br>a working product",
    approachLead: "First, I define the real business problem. Then I design the flows, architecture and implementation as one system with a testable result.",
    journeyLabel: "FIVE STAGES / ONE CONTEXT",
    details: "Details",
    closeDetails: "Close details",
    stage: "stage",
    journey: [
      { marker: "01", label: "CONTEXT", title: "Goal and criteria", summary: "Define the problem, audience, constraints and measurable outcome for version one.", detail: "The work starts with the business problem, not a list of screens. We define the core flow, first-release boundaries and evidence that the solution works." },
      { marker: "02", label: "ARCHITECTURE", title: "Flows and data", summary: "Connect user journeys, roles, entities and integrations in a clear model.", detail: "User flows, the data model and technical dependencies are designed together. This reduces rework and makes future change predictable." },
      { marker: "03", label: "INTERFACE", title: "A clear form", summary: "Build hierarchy and a visual system around the user’s decisions.", detail: "The prototype and design explain the product without unnecessary decoration. Every screen answers a question and leads to the next action." },
      { marker: "04", label: "DEVELOPMENT", title: "The solution in code", summary: "Connect interface, logic, data and integrations into a working product.", detail: "Features are delivered in short, testable stages. Interface and server logic are checked together, so the final product stays aligned with the agreed flow." },
      { marker: "05", label: "LAUNCH", title: "Control and growth", summary: "Validate core journeys, hand over control and leave room for the next version.", detail: "Before launch, responsiveness, accessibility, data and infrastructure are checked. Content remains manageable and the architecture is ready to evolve." },
    ],
    overviewEyebrow: "03 / OUTCOMES",
    overviewTitle: "What the business gets",
    overviewLead: "Not a collection of screens, but a tool built for a real process: clear to users, manageable inside and ready to evolve.",
    capabilities: [["01", "A clear journey", "Users understand the value and their next action without studying the interface."], ["02", "A working product", "Flows, roles, data and integrations operate as one coherent system."], ["03", "Less manual work", "Repeated operations are automated where they genuinely save time."], ["04", "Room to grow", "Content, architecture and documentation support the next version without a rebuild."]],
    servicesEyebrow: "04 / SERVICES",
    servicesTitle: "The product format follows the problem",
    servicesLead: "We solve a concrete business problem and turn it into a working digital product designed to grow revenue, save time or reduce operating costs. We start with a focused first release and evolve it using real evidence.",
    discussDirection: "Discuss this service",
    services: [
      { number: "01", label: "WEBSITES", title: "Websites", description: "A digital point of contact that explains the offer clearly and leads people to the right action.", items: ["Corporate websites", "Product pages", "Landing pages", "Content systems"] },
      { number: "02", label: "DIGITAL SYSTEMS", title: "Digital systems", description: "A manageable operating layer for processes, roles and day-to-day business actions.", items: ["User workspaces", "Operations panels", "Role management", "Business workflows"] },
      { number: "03", label: "WEB APPLICATIONS", title: "Web applications", description: "Complete products with business logic, data and end-to-end user journeys.", items: ["MVPs and services", "Client platforms", "Catalogues and booking", "Product logic"] },
      { number: "04", label: "AUTOMATION", title: "Automation", description: "I connect data and operations to reduce routine work and make the process controllable.", items: ["Service connections", "Data processing", "Routine reduction", "Operational control"] },
    ],
    principleEyebrow: "05 / PRINCIPLE",
    principleLines: ["Digital architecture", "× engineering precision", "× precise development"],
    principleSummary: "Structure. Logic. Quality.",
    startConversation: "Start a conversation",
    proofEyebrow: "06 / COLLABORATION",
    proofTitle: "A transparent process, a testable result",
    proofLabel: "Collaboration principles",
    previousProof: "Previous principle",
    nextProof: "Next principle",
    proofSlides: [
      { index: "01", title: "One context throughout", text: "Structure, visual language and code are treated as parts of one product instead of being passed down a chain of specialists.", meta: "PRODUCT / DESIGN / DEVELOPMENT" },
      { index: "02", title: "Progress stays visible", text: "Working slices and constraints are discussed before decisions become expensive and difficult to replace.", meta: "SHORT ITERATIONS / CLEAR FEEDBACK" },
      { index: "03", title: "You retain control", text: "Content, data and key operations receive a clear administrative layer and a path for further development.", meta: "HANDOFF / OWNERSHIP / EVOLUTION" },
    ],
    faqEyebrow: "07 / FAQ",
    faqTitle: "Before we start",
    faq: [["How does the work begin?", "With a short context: the problem, audience, existing materials and success criteria. I then propose the format and first-release scope."], ["Can we start small?", "Yes. A useful core is usually better than a long feature list, and it can be designed to grow without a rebuild."], ["Is design included?", "Yes. Structure, UX and visual direction are treated as parts of the same solution."], ["Can you improve an existing product?", "Yes, after reviewing its code, data and infrastructure. We then decide what is safe to evolve and what should be replaced."], ["What happens after launch?", "Real journeys and infrastructure are checked. We can continue with support, a next phase or a documented handoff."], ["How are time and budget estimated?", "Describe the task, desired outcome and constraints. I will propose a realistic first scope and the questions needed for a precise estimate."]],
    backToTop: "Back to top",
  },
};
const projectCopy = {
  ru: {
    eyebrow: "02 / ИЗБРАННЫЕ ПРОЕКТЫ",
    title: "Задача. Решение.<br>Работающий продукт.",
    lead: "Каждый кейс показывает контекст, задачу, архитектуру решения, реализацию и полученный результат.",
    descriptions: {
      "beauty-booking": "Продукт, который соединяет поиск салона, запись клиента и управление операциями.",
      "library-system": "Система, которая объединяет каталог, бронирование, выдачу и работу администратора.",
    },
    signals: {
      "beauty-booking": ["ЗАПИСЬ", "ОПЕРАЦИИ", "РОЛИ"],
      "library-system": ["КАТАЛОГ", "БРОНИРОВАНИЕ", "УЧЁТ"],
    },
    all: "Все проекты",
    open: "Открыть кейс",
    endTitle: "Следующий проект может быть вашим",
    endCta: "Обсудить задачу",
  },
  en: {
    eyebrow: "02 / SELECTED WORK",
    title: "Problem. Solution.<br>Working product.",
    lead: "Each case explains the context, the problem, the solution architecture, the implementation and the result.",
    descriptions: {
      "beauty-booking": "A product connecting salon discovery, customer booking and day-to-day operations.",
      "library-system": "A system unifying the catalogue, reservations, lending and administrator workflow.",
    },
    signals: {
      "beauty-booking": ["BOOKING", "OPERATIONS", "ROLES"],
      "library-system": ["CATALOGUE", "RESERVATIONS", "CONTROL"],
    },
    all: "All projects",
    open: "Open case study",
    endTitle: "Your project could be next",
    endCta: "Discuss a project",
  },
};
const contactCopy = {
  ru: {
    eyebrow: "08 / НАЧАТЬ ПРОЕКТ",
    title: "Обсудим задачу",
    lead: "Достаточно контекста в нескольких предложениях. Я отвечу с вопросами, реалистичным первым контуром и следующим шагом.",
    telegram: "Написать напрямую в Telegram",
    formTitle: "Короткая анкета",
    formLead: "Заполните поля — сайт примет заявку. Telegram остаётся отдельным быстрым способом связи.",
    name: "Имя",
    contact: "Контакт для ответа",
    company: "Компания или проект",
    type: "Тип проекта",
    unsure: "Пока не уверен",
    own: "Своё",
    ownLabel: "Укажите свой тип",
    types: ["Сайт", "Цифровая система", "Веб-приложение", "Автоматизация", "Своё", "Пока не уверен"],
    description: "Что нужно решить",
    descriptionHint: "Опишите текущую ситуацию, желаемый результат и важные ограничения.",
    budget: "Ориентир по бюджету",
    deadline: "Желаемый срок",
    submit: "Отправить заявку",
    submitting: "Отправляю…",
    validation: "Заполните имя, контакт и кратко опишите задачу.",
    serverError: "Не удалось отправить заявку. Попробуйте ещё раз или напишите напрямую в Telegram.",
    ready: "Заявка принята",
    readyText: "Бриф сохранён. При желании оставьте себе копию или продублируйте сообщение в Telegram.",
    sendTelegram: "Продублировать в Telegram",
    copy: "Скопировать анкету",
    copied: "Анкета скопирована",
    edit: "Отправить другую заявку",
    briefTitle: "Новая заявка с rqke.systems",
    notSpecified: "не указано",
  },
  en: {
    eyebrow: "08 / START A PROJECT",
    title: "Let’s discuss the problem",
    lead: "A few sentences of context are enough. I will reply with focused questions, a realistic first scope and the next step.",
    telegram: "Message me directly on Telegram",
    formTitle: "Short project brief",
    formLead: "Complete the fields and the site will accept your enquiry. Telegram remains a separate fast contact option.",
    name: "Name",
    contact: "Contact for reply",
    company: "Company or project",
    type: "Project type",
    unsure: "Not sure yet",
    own: "Other",
    ownLabel: "Specify the project type",
    types: ["Website", "Digital system", "Web application", "Automation", "Other", "Not sure yet"],
    description: "What needs to be solved",
    descriptionHint: "Describe the current situation, desired outcome and important constraints.",
    budget: "Budget range",
    deadline: "Preferred timeline",
    submit: "Send enquiry",
    submitting: "Sending…",
    validation: "Add your name, contact and a short project description.",
    serverError: "The enquiry could not be sent. Try again or message me directly on Telegram.",
    ready: "Enquiry accepted",
    readyText: "The brief has been saved. You can keep a copy or duplicate it in Telegram if useful.",
    sendTelegram: "Duplicate in Telegram",
    copy: "Copy the brief",
    copied: "Brief copied",
    edit: "Send another enquiry",
    briefTitle: "New enquiry from rqke.systems",
    notSpecified: "not specified",
  },
};
  const { icons, root, language: getLanguage, switchLanguage, rolling, internal, fixRuTypography } = RQKE;
  const data = RQKE_DATA;
  const main = document.getElementById('main');
  if (!main) return;

  let language = getLanguage();
  let copy = dictionary[language];
  let projectText = projectCopy[language];
  let contactText = { ...contactCopy[language] };
  if (language === 'ru') {
    contactText.formLead = 'Заполните поля — сайт соберёт готовый бриф. Его можно скопировать или сразу продублировать в Telegram.';
    contactText.submit = 'Сформировать заявку';
    contactText.submitting = 'Формирую…';
    contactText.ready = 'Бриф готов';
    contactText.readyText = 'Заявка сформирована прямо в браузере. Скопируйте её или продублируйте сообщение в Telegram.';
  } else {
    contactText.formLead = 'Complete the fields and the site will build a ready-to-send brief. You can copy it or duplicate it in Telegram.';
    contactText.submit = 'Build enquiry';
    contactText.submitting = 'Building…';
    contactText.ready = 'Brief ready';
    contactText.readyText = 'The enquiry was generated in your browser. Copy it or duplicate the message in Telegram.';
  }

  const projects = data.projects.filter(project => project.featured);
  const github = data.links.find(link => link.id === 'github')?.url || 'https://github.com/rqkeqq-ui';
  const telegram = data.links.find(link => link.id === 'telegram')?.url || 'https://t.me/lqkeee';
  const navigation = copy.navigation.map(([id, label]) => ({ id, label }));
  const serviceIcons = ['globe', 'database', 'app', 'workflow'];
  const sectionIds = ['home', 'about', 'projects', 'overview', 'services', 'testimonial', 'faq', 'contact'];
  const asset = src => root(src.replace(/^\/images\//, 'assets/images/'));
  const escape = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function projectHref(slug) { return internal(`projects/${slug}/`, language); }

  function renderProjectRail() {
    return `
      <section id="projects" class="projects-rail-section" style="height:${Math.max(210, 120 + projects.length * 48)}svh" aria-labelledby="projects-title">
        <div class="projects-rail-sticky">
          <div class="projects-rail-heading">
            <p class="eyebrow">${projectText.eyebrow}</p>
            <h2 id="projects-title">${projectText.title}</h2>
            <p>${projectText.lead}</p>
          </div>
          <div class="project-rail-viewport">
            <div class="project-rail-track" data-has-focus="false" data-video-ready="true">
              ${projects.map((project, index) => {
                const signals = projectText.signals[project.slug] || [data.formatCategory(project.category, language)];
                const description = projectText.descriptions[project.slug] || project.shortDescription;
                return `<a href="${projectHref(project.slug)}" class="project-rail-card" data-index="${index}" data-active="${index === 0}" aria-label="${escape(projectText.open)}: ${escape(project.title)}" data-device="none" style="--project-fit:cover">
                  <span class="project-rail-media"><img src="${asset(project.coverImage.src)}" alt="" loading="lazy"></span>
                  <span class="project-rail-motion" aria-hidden="true"></span><span class="project-rail-shade" aria-hidden="true"></span>
                  <span class="project-rail-topline"><span class="project-rail-number">${String(index + 1).padStart(2, '0')}</span><span class="project-rail-tags">${signals.map(item => `<span>${escape(item)}</span>`).join('')}</span></span>
                  <span class="project-rail-copy"><span class="project-rail-type">${escape(data.formatCategory(project.category, language))} / ${escape(project.year)}</span><strong>${escape(project.title)}</strong><span class="project-rail-description">${escape(description)}</span></span>
                  <span class="project-rail-arrow" aria-hidden="true">${icons.arrowUpRight}</span>
                </a>`;
              }).join('')}
              <div class="project-rail-end" aria-label="${escape(projectText.endTitle)}"><span>rqke / NEXT</span><strong>${projectText.endTitle}</strong><a href="#contact">${projectText.endCta} ${icons.arrowUpRight}</a></div>
            </div>
          </div>
          <div class="projects-rail-footer"><span class="projects-rail-counter">01 / ${String(projects.length).padStart(2, '0')}</span><a href="${internal('projects/', language)}">${projectText.all}${icons.arrowUpRight}</a></div>
        </div>
      </section>`;
  }

  function renderContact() {
    return `<section id="contact" class="contact-section" aria-labelledby="contact-title">
      <div class="contact-copy"><p class="eyebrow">${contactText.eyebrow}</p><h2 id="contact-title">${contactText.title}</h2><p>${contactText.lead}</p><a class="contact-direct" href="${telegram}" target="_blank" rel="noreferrer">${icons.send}${contactText.telegram}${icons.arrowUpRight}</a></div>
      <form class="contact-form" novalidate>
          <div class="contact-form-heading"><h3>${contactText.formTitle}</h3><p>${contactText.formLead}</p></div>
          <label class="contact-honeypot" aria-hidden="true">Website<input name="website" autocomplete="off" tabindex="-1"></label>
          <div class="field-row"><label>${contactText.name} *<input name="name" autocomplete="name" required></label><label>${contactText.contact} *<input name="contact" autocomplete="email" required></label></div>
          <div class="field-row"><label>${contactText.company}<input name="company" autocomplete="organization"></label><div class="project-type-field"><label>${contactText.type}<select name="type">${contactText.types.map(item => `<option${item === contactText.unsure ? ' selected' : ''}>${item}</option>`).join('')}</select></label><label class="custom-project-type" hidden>${contactText.ownLabel}<input name="customType" autocomplete="off"></label></div></div>
          <label>${contactText.description} *<textarea name="description" rows="5" required placeholder="${escape(contactText.descriptionHint)}"></textarea></label>
          <div class="field-row"><label>${contactText.budget}<input name="budget"></label><label>${contactText.deadline}<input name="deadline"></label></div>
          <p class="form-error" role="alert" hidden></p>
          <button class="button button-dark" type="submit">${contactText.submit}${icons.arrowUpRight}</button>
      </form>
    </section>`;
  }

  function renderFaq() {
    const splitAt = Math.ceil(copy.faq.length / 2);
    const columns = [copy.faq.slice(0, splitAt), copy.faq.slice(splitAt)];
    return `<div class="rk-faq-grid">${columns.map(column => `<div class="rk-faq-column">${column.map(([question, answer]) => `<details data-reveal><summary><span>${question}</span><i aria-hidden="true"></i></summary><div class="rk-faq-answer"><p>${answer}</p></div></details>`).join('')}</div>`).join('')}</div>`;
  }

  function render() {
    document.title = language === 'ru' ? 'rqke / SYSTEMS — разработчик цифровых решений' : 'rqke / SYSTEMS — Independent Developer';
    const description = language === 'ru' ? 'Создаю цифровые продукты и системы, которые помогают решать реальные задачи бизнеса.' : 'I build digital products and systems that solve real business problems.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);

    main.className = 'rqke-experience';
    main.dataset.language = language;
    main.innerHTML = `
      <div class="rk-intro" data-state="visible" aria-hidden="true"><span>rqke</span><i></i><small>${copy.intro}</small></div>
      <header class="rk-mobile-header"><a class="rk-mobile-brand" href="#home" aria-label="${copy.homeLabel}">rqke <i>/</i> <span>SYSTEMS</span></a><div class="rk-mobile-tools"><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a><button class="rk-mobile-menu-button" type="button" aria-label="${copy.openMenu}" aria-controls="rk-mobile-menu" aria-expanded="false">${icons.menu}</button></div></header>
      <div id="rk-mobile-menu" class="rk-mobile-menu" data-open="false" aria-hidden="true"><p>rqke / NAVIGATION / 2026</p><nav aria-label="${copy.navLabel}">${navigation.map((item, index) => `<a href="#${item.id}" tabindex="-1"><small>${String(index + 1).padStart(2, '0')}</small><span>${item.label}</span>${icons.arrowUpRight}</a>`).join('')}</nav></div>
      <aside class="rk-rail" data-visible="false" data-theme="light" aria-label="${copy.railLabel}" aria-hidden="true" inert>
        <div class="rk-rail-brand"><div><a href="#home">rqke <i>/</i></a><span>SYSTEMS</span></div><div class="rk-rail-socials"><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button></div><p>${copy.railText}</p></div>
        <nav class="rk-rail-nav" aria-label="${copy.navLabel}">${navigation.map((item, index) => `<a href="#${item.id}"${index === 0 ? ' aria-current="location"' : ''}><span>${String(index + 1).padStart(2, '0')}</span><span>${item.label}</span></a>`).join('')}</nav>
        <div class="rk-rail-marquee" aria-label="rqke systems"><div>${['CONTEXT','ARCHITECTURE','DEVELOPMENT','RESULT','CONTEXT','ARCHITECTURE','DEVELOPMENT','RESULT'].map(item => `<span>${item}</span>`).join('')}</div></div>
        <a class="rk-rail-cta" href="${telegram}" target="_blank" rel="noreferrer">${rolling(copy.railCta)}${icons.arrowUpRight}</a>
      </aside>
      <section id="home" class="rk-hero-shell" aria-labelledby="hero-title"><div class="rk-hero-stage"><div class="rk-hero-grid" aria-hidden="true"></div><p class="rk-hero-wordmark" aria-hidden="true">rqke <span>/ SYSTEMS</span></p>
        <nav class="rk-hero-nav rk-hero-nav-left" aria-label="${copy.navLabel}">${navigation.slice(0,3).map(item => `<a href="#${item.id}">${rolling(item.label)}</a>`).join('')}</nav><nav class="rk-hero-nav rk-hero-nav-right" aria-label="${copy.navLabel}">${navigation.slice(3).map(item => `<a href="#${item.id}">${rolling(item.label)}</a>`).join('')}</nav>
        <div class="rk-hero-tools"><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a></div>
        <div class="rk-hero-sculpture" aria-hidden="true"><div class="rk-hero-orbit"></div><img src="${root('assets/images/statues/rqke-hero-cutout.svg')}" alt="" width="1122" height="1402"></div>
        <div class="rk-hero-traits">${copy.traits.map(item => `<p>${icons.check}${item}</p>`).join('')}</div>
        <div class="rk-hero-copy"><p class="rk-hero-kicker">${copy.heroKicker}</p><h1 id="hero-title">${copy.heroTitle} <em>${copy.heroAccent}</em></h1><p class="rk-hero-lead">${copy.heroText}</p><div class="rk-hero-actions"><a class="rk-hero-primary" href="#projects">${rolling(copy.viewProjects)}${icons.arrowDown}</a><a class="rk-hero-secondary" href="#contact">${rolling(copy.discussProject)}${icons.arrowUpRight}</a></div></div>
      </div></section>
      <section id="about" class="rk-section rk-about" aria-labelledby="about-title"><div class="rk-section-intro" data-reveal><p class="rk-eyebrow">${copy.approachEyebrow}</p><h2 id="about-title">${copy.approachTitle}</h2><p>${copy.approachLead}</p></div><div class="rk-journey" aria-label="${copy.journeyLabel}"><p class="rk-journey-label">${copy.journeyLabel}</p><svg class="rk-journey-path" aria-hidden="true" focusable="false"><path></path></svg><div class="rk-journey-list">${copy.journey.map((item,index) => `<article class="rk-journey-card" data-reveal data-journey-index="${index}" style="--reveal-delay:${index*35}ms"><span class="rk-journey-anchor" aria-hidden="true"></span><div><span>${item.marker}</span><small><b aria-hidden="true">/</b>${item.label}</small></div><h3>${item.title}</h3><p>${item.summary}</p><div><small class="rk-stage-signature">rqke / SYSTEMS · ${String(index+1).padStart(2,'0')} ${copy.stage}</small><button type="button" aria-label="${copy.details}: ${escape(item.title)}">${rolling(copy.details)}${icons.arrowUpRight}</button></div></article>`).join('')}</div></div></section>
      <dialog class="rk-journey-dialog" aria-labelledby="rk-dialog-title"></dialog>
      ${renderProjectRail()}
      <section id="overview" class="rk-section rk-overview" aria-labelledby="overview-title"><div class="rk-overview-heading" data-reveal><p class="rk-eyebrow">${copy.overviewEyebrow}</p><h2 id="overview-title">${copy.overviewTitle}</h2><p>${copy.overviewLead}</p></div><div class="rk-capability-list">${copy.capabilities.map(([number,title,description]) => `<article data-reveal><span>${number}</span><h3>${title}</h3><p>${description}</p>${icons.arrowUpRight}</article>`).join('')}</div></section>
      <section id="services" class="rk-section rk-services" aria-labelledby="services-title"><div class="rk-services-intro" data-reveal><p class="rk-eyebrow">${copy.servicesEyebrow}</p><h2 id="services-title">${copy.servicesTitle}</h2><p>${copy.servicesLead}</p></div><div class="rk-service-grid">${copy.services.map((service,index) => `<article data-reveal style="--reveal-delay:${index*45}ms"><div><span>${service.number}</span><small>${service.label}</small>${icons[serviceIcons[index]]}</div><h3>${service.title}</h3><p>${service.description}</p><ul>${service.items.map(item => `<li>${icons.check}${item}</li>`).join('')}</ul><a href="#contact">${rolling(copy.discussDirection)}${icons.arrowUpRight}</a></article>`).join('')}</div></section>
      <section class="rk-manifesto" aria-labelledby="manifesto-title"><div class="rk-manifesto-sticky"><p class="rk-eyebrow">${copy.principleEyebrow}</p><h2 id="manifesto-title">${copy.principleLines.map((line,index) => `<span${index===1?' class="is-accent"':''}>${line}</span>`).join('')}</h2><div><p>${copy.principleSummary}</p><a href="#contact">${rolling(copy.startConversation)}${icons.arrowUpRight}</a></div></div></section>
      <section id="testimonial" class="rk-section rk-proof" aria-labelledby="proof-title"><div class="rk-proof-heading" data-reveal><p class="rk-eyebrow">${copy.proofEyebrow}</p><h2 id="proof-title">${copy.proofTitle}</h2><div class="rk-proof-controls" role="tablist" aria-label="${copy.proofLabel}">${copy.proofSlides.map((slide,index)=>`<button type="button" role="tab" aria-selected="${index===0}" aria-controls="rk-proof-panel" data-proof-index="${index}">${slide.index}</button>`).join('')}</div></div><div id="rk-proof-panel" class="rk-proof-card" role="tabpanel" tabindex="0" aria-live="polite"></div></section>
      <section id="faq" class="rk-section rk-faq" aria-labelledby="faq-title"><div class="rk-faq-heading" data-reveal><p class="rk-eyebrow">${copy.faqEyebrow}</p><h2 id="faq-title">${copy.faqTitle}</h2></div>${renderFaq()}</section>
      ${renderContact()}
      <a class="rk-floating-mark" href="#home" data-scene="home" aria-label="${copy.backToTop}">rqke</a>`;
  }

  render();

  const intro = main.querySelector('.rk-intro');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipIntro = reducedMotion || Boolean(location.hash) || sessionStorage.getItem('rqke-intro-seen') === 'true';
  if (skipIntro) intro?.remove();
  else {
    sessionStorage.setItem('rqke-intro-seen', 'true');
    setTimeout(() => intro?.setAttribute('data-state', 'leaving'), 1250);
    setTimeout(() => intro?.remove(), 1900);
  }

  main.querySelectorAll('.js-language').forEach(button => button.addEventListener('click', switchLanguage));

  const mobileToggle = main.querySelector('.rk-mobile-menu-button');
  const mobileMenu = main.querySelector('.rk-mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a') || [];
  function setMobileMenu(open) {
    mobileMenu?.setAttribute('data-open', String(open));
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    mobileToggle?.setAttribute('aria-expanded', String(open));
    mobileToggle?.setAttribute('aria-label', open ? copy.closeMenu : copy.openMenu);
    if (mobileToggle) mobileToggle.innerHTML = open ? icons.close : icons.menu;
    mobileLinks.forEach(link => link.tabIndex = open ? 0 : -1);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  mobileToggle?.addEventListener('click', () => setMobileMenu(mobileToggle.getAttribute('aria-expanded') !== 'true'));
  mobileLinks.forEach(link => link.addEventListener('click', () => setMobileMenu(false)));
  addEventListener('keydown', event => { if (event.key === 'Escape') setMobileMenu(false); });

  const rail = main.querySelector('.rk-rail');
  const hero = main.querySelector('.rk-hero-shell');
  const journeySection = main.querySelector('.rk-journey');
  const journeyPath = main.querySelector('.rk-journey-path');
  const journeyPathLine = journeyPath?.querySelector('path');
  const journeyAnchors = [...main.querySelectorAll('.rk-journey-anchor')];
  const floatingMark = main.querySelector('.rk-floating-mark');
  let journeyPathLength = 0;
  let journeyPoints = [];
  let journeyAnchorThresholds = [];
  let scrollFrame = 0;
  const clamp = value => Math.min(1, Math.max(0, value));

  function getJourneyPoint(anchor) {
    let x = anchor.offsetLeft + anchor.offsetWidth / 2;
    let y = anchor.offsetTop + anchor.offsetHeight / 2;
    let parent = anchor.offsetParent;
    while (parent && parent !== journeySection) {
      x += parent.offsetLeft;
      y += parent.offsetTop;
      parent = parent.offsetParent;
    }
    return { x, y };
  }

  function layoutJourneyPath() {
    if (!journeySection || !journeyPath || !journeyPathLine || journeyAnchors.length < 2) return;

    const width = Math.max(1, journeySection.clientWidth);
    const height = Math.max(1, journeySection.clientHeight);
    journeyPoints = journeyAnchors.map(getJourneyPoint);
    journeyPath.setAttribute('viewBox', `0 0 ${width} ${height}`);
    journeyPath.setAttribute('preserveAspectRatio', 'none');

    const forceMobile = document.documentElement.classList.contains('rqke-force-mobile');
    const visualWidth = window.visualViewport?.width ?? window.innerWidth;
    const isMobileJourney = forceMobile || visualWidth <= 767 || matchMedia('(max-width: 900px) and (max-height: 520px)').matches;

    let d = `M ${journeyPoints[0].x.toFixed(2)} ${journeyPoints[0].y.toFixed(2)}`;
    const segmentDefs = [];

    for (let index = 1; index < journeyPoints.length; index += 1) {
      const previous = journeyPoints[index - 1];
      const current = journeyPoints[index];
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      let segment = '';

      if (isMobileJourney) {
        // Markers sit on the card border. The curve bows only into the free
        // gutter, then returns to the next card border marker.
        const borderX = Math.min(previous.x, current.x);
        const directionBias = index % 2 ? 1 : 0;
        const amplitude = 15 + directionBias * 5;
        const controlX = Math.max(8, borderX - amplitude);
        const c1y = previous.y + dy * .33;
        const c2y = current.y - dy * .33;
        segment = `C ${controlX.toFixed(2)} ${c1y.toFixed(2)}, ${controlX.toFixed(2)} ${c2y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      } else {
        const direction = dx === 0 ? (index % 2 ? 1 : -1) : Math.sign(dx);
        const horizontalBend = dx === 0
          ? Math.min(width * .13, 190)
          : Math.max(110, Math.min(Math.abs(dx) * .5, 300));
        const c1x = previous.x + horizontalBend * direction;
        const c2x = current.x - horizontalBend * direction;
        const c1y = previous.y + dy * .3;
        const c2y = current.y - dy * .3;
        segment = `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      }

      d += ` ${segment}`;
      segmentDefs.push({ previous, segment });
    }

    journeyPathLine.setAttribute('d', d);
    journeyPathLength = journeyPathLine.getTotalLength();
    journeyPathLine.style.strokeDasharray = `${journeyPathLength}`;
    journeyPathLine.style.strokeDashoffset = `${journeyPathLength}`;

    // Compute the exact path-length moment at which every marker is reached.
    // This keeps dots hidden until the animated line actually arrives there.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.setAttribute('fill', 'none');
    probe.setAttribute('visibility', 'hidden');
    journeyPath.appendChild(probe);
    let cumulative = 0;
    const cumulativeLengths = [0];
    for (const { previous, segment } of segmentDefs) {
      probe.setAttribute('d', `M ${previous.x} ${previous.y} ${segment}`);
      cumulative += probe.getTotalLength();
      cumulativeLengths.push(cumulative);
    }
    probe.remove();
    journeyAnchorThresholds = cumulativeLengths.map(length => journeyPathLength ? length / journeyPathLength : 0);

    if (reducedMotion) {
      journeySection.classList.remove('rk-journey-path-ready');
      journeyPathLine.style.strokeDashoffset = '0';
      journeyAnchors.forEach(anchor => anchor.removeAttribute('data-reached'));
      return;
    }

    journeySection.classList.add('rk-journey-path-ready');
    updateJourneyDrawing();
  }

  function updateJourneyDrawing() {
    if (!journeySection || !journeyPathLine || !journeyPathLength || journeyPoints.length < 2 || reducedMotion) return;
    const sectionTop = journeySection.getBoundingClientRect().top;
    const startY = sectionTop + journeyPoints[0].y;
    const endY = sectionTop + journeyPoints[journeyPoints.length - 1].y;
    const triggerY = innerHeight * .9;
    const progress = clamp((triggerY - startY) / Math.max(1, endY - startY));
    journeySection.style.setProperty('--journey-progress', String(progress));
    journeyPathLine.style.strokeDashoffset = `${journeyPathLength * (1 - progress)}`;

    journeyAnchors.forEach((anchor, index) => {
      const threshold = journeyAnchorThresholds[index] ?? 1;
      const reached = progress >= Math.max(0, threshold - .012) && (index !== 0 || progress > .002);
      anchor.setAttribute('data-reached', String(reached));
    });
  }

  function updateScrollEffects() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const range = Math.max(1, hero.offsetHeight - innerHeight);
        hero.style.setProperty('--hero-progress', String(clamp(-rect.top / range)));
        const visible = rect.bottom <= innerHeight * 1.08;
        rail?.setAttribute('data-visible', String(visible));
        rail?.setAttribute('aria-hidden', String(!visible));
        if (rail) rail.inert = !visible;
      }
      updateJourneyDrawing();
      updateProjectRailFromPage();
    });
  }
  addEventListener('scroll', updateScrollEffects, { passive: true });
  addEventListener('resize', () => {
    layoutJourneyPath();
    updateScrollEffects();
  });
  if ('ResizeObserver' in window && journeySection) {
    const journeyResizeObserver = new ResizeObserver(() => requestAnimationFrame(() => {
      layoutJourneyPath();
      updateScrollEffects();
    }));
    journeyResizeObserver.observe(journeySection);
  }
  document.fonts?.ready.then(() => requestAnimationFrame(() => {
    layoutJourneyPath();
    updateScrollEffects();
  }));

  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible?.target.id) return;
    const active = visible.target.id;
    floatingMark?.setAttribute('data-scene', active);
    rail?.setAttribute('data-theme', active === 'projects' || active === 'services' ? 'dark' : 'light');
    main.querySelectorAll('.rk-rail-nav a').forEach(link => {
      if (link.getAttribute('href') === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-30% 0px -58% 0px', threshold: [0,.05,.2,.5] });
  sectionIds.map(id => document.getElementById(id)).filter(Boolean).forEach(section => sectionObserver.observe(section));

  const revealNodes = [...main.querySelectorAll('[data-reveal]')];
  if (reducedMotion) revealNodes.forEach(node => node.setAttribute('data-visible','true'));
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.setAttribute('data-visible','true'); revealObserver.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealNodes.forEach(node => revealObserver.observe(node));
  }

  const dialog = main.querySelector('.rk-journey-dialog');
  let journeyTrigger = null;
  function closeJourney() { if (dialog?.open) dialog.close(); requestAnimationFrame(() => journeyTrigger?.focus()); }
  main.querySelectorAll('.rk-journey-card').forEach(card => card.querySelector('button')?.addEventListener('click', event => {
    const index = Number(card.dataset.journeyIndex);
    const item = copy.journey[index];
    journeyTrigger = event.currentTarget;
    dialog.innerHTML = `<div><button type="button" aria-label="${copy.closeDetails}">${icons.close}</button><p>${item.marker} / ${item.label}</p><h2 id="rk-dialog-title">${item.title}</h2><p>${item.detail}</p><span>rqke / STRUCTURE × LOGIC × DEVELOPMENT</span></div>`;
    fixRuTypography(dialog);
    dialog.querySelector('button')?.addEventListener('click', closeJourney);
    dialog.showModal();
    dialog.querySelector('button')?.focus();
  }));
  dialog?.addEventListener('cancel', event => { event.preventDefault(); closeJourney(); });
  dialog?.addEventListener('click', event => { if (event.target === dialog) closeJourney(); });

  const railSection = main.querySelector('.projects-rail-section');
  const projectViewport = main.querySelector('.project-rail-viewport');
  const projectTrack = main.querySelector('.project-rail-track');
  const projectCards = [...main.querySelectorAll('.project-rail-card')];
  const projectCounter = main.querySelector('.projects-rail-counter');
  let scrollActive = 0;
  let hovered = null;
  const compact = matchMedia('(max-width: 767px), (max-width: 900px) and (max-height: 520px)');
  function setProjectActive(index) {
    scrollActive = Math.min(projectCards.length - 1, Math.max(0, index));
    const display = hovered ?? scrollActive;
    projectCards.forEach((card, cardIndex) => card.setAttribute('data-active', String(cardIndex === display)));
    projectTrack?.setAttribute('data-has-focus', String(hovered !== null));
    if (projectCounter) projectCounter.textContent = `${String(display + 1).padStart(2,'0')} / ${String(projectCards.length).padStart(2,'0')}`;
  }
  projectCards.forEach((card,index) => {
    card.addEventListener('pointerenter', () => { hovered = index; setProjectActive(scrollActive); });
    card.addEventListener('pointerleave', () => { hovered = null; setProjectActive(scrollActive); });
    card.addEventListener('focus', () => { hovered = index; setProjectActive(scrollActive); });
    card.addEventListener('blur', () => { hovered = null; setProjectActive(scrollActive); });
  });
  function updateProjectRailFromPage() {
    if (!railSection || !projectTrack || compact.matches || reducedMotion) { railSection?.style.setProperty('--rail-x','0px'); return; }
    const rect = railSection.getBoundingClientRect();
    const range = Math.max(1, railSection.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / range);
    const side = Math.max(28, innerWidth * .04);
    const travel = Math.max(0, projectTrack.scrollWidth - innerWidth + side);
    railSection.style.setProperty('--rail-x', `${-progress * travel}px`);
    setProjectActive(Math.round(progress * Math.max(0, projectCards.length - 1)));
  }
  projectViewport?.addEventListener('scroll', () => {
    if (!compact.matches && !reducedMotion) return;
    requestAnimationFrame(() => {
      const viewportLeft = projectViewport.getBoundingClientRect().left;
      const closest = projectCards.reduce((best, card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - viewportLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index:0, distance:Infinity });
      setProjectActive(closest.index);
    });
  }, { passive: true });

  let proofIndex = 0;
  const proofPanel = main.querySelector('#rk-proof-panel');
  function renderProof() {
    const slide = copy.proofSlides[proofIndex];
    proofPanel.innerHTML = `<span>${slide.index} / 03</span><h3>${slide.title}</h3><p>${slide.text}</p><div><small>${slide.meta}</small><span><button type="button" class="proof-prev" aria-label="${copy.previousProof}">${icons.arrowLeft}</button><button type="button" class="proof-next" aria-label="${copy.nextProof}">${icons.arrowRight}</button></span></div>`;
    fixRuTypography(proofPanel);
    main.querySelectorAll('[data-proof-index]').forEach((button,index) => button.setAttribute('aria-selected', String(index === proofIndex)));
    proofPanel.querySelector('.proof-prev')?.addEventListener('click', () => { proofIndex = (proofIndex - 1 + copy.proofSlides.length) % copy.proofSlides.length; renderProof(); });
    proofPanel.querySelector('.proof-next')?.addEventListener('click', () => { proofIndex = (proofIndex + 1) % copy.proofSlides.length; renderProof(); });
  }
  main.querySelectorAll('[data-proof-index]').forEach(button => button.addEventListener('click', () => { proofIndex = Number(button.dataset.proofIndex); renderProof(); }));
  proofPanel?.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { proofIndex = (proofIndex + 1) % copy.proofSlides.length; renderProof(); } if (event.key === 'ArrowLeft') { proofIndex = (proofIndex - 1 + copy.proofSlides.length) % copy.proofSlides.length; renderProof(); } });
  renderProof();

  const form = main.querySelector('.contact-form');
  const typeSelect = form?.querySelector('[name="type"]');
  const customTypeField = form?.querySelector('.custom-project-type');
  const syncCustomType = () => {
    if (!typeSelect || !customTypeField) return;
    const show = typeSelect.value === contactText.own;
    customTypeField.hidden = !show;
    customTypeField.querySelector('input')?.toggleAttribute('required', show);
  };
  typeSelect?.addEventListener('change', syncCustomType);
  syncCustomType();

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const error = form.querySelector('.form-error');
    if (!name || !contact || !description) {
      error.textContent = contactText.validation;
      error.hidden = false;
      (form.querySelector(':invalid') || form.querySelector('[name="name"]'))?.focus();
      return;
    }
    const payload = {
      name, contact,
      company: String(formData.get('company') || '').trim(),
      type: String(formData.get('type') || contactText.unsure) === contactText.own
        ? (String(formData.get('customType') || '').trim() || contactText.own)
        : String(formData.get('type') || contactText.unsure),
      description,
      budget: String(formData.get('budget') || '').trim(),
      deadline: String(formData.get('deadline') || '').trim()
    };
    const brief = [contactText.briefTitle, `${contactText.name}: ${payload.name}`, `${contactText.contact}: ${payload.contact}`, `${contactText.company}: ${payload.company || contactText.notSpecified}`, `${contactText.type}: ${payload.type}`, `${contactText.budget}: ${payload.budget || contactText.notSpecified}`, `${contactText.deadline}: ${payload.deadline || contactText.notSpecified}`, '', `${contactText.description}:`, payload.description].join('\n');
    const briefNode = document.createElement('div');
    briefNode.className = 'contact-brief';
    briefNode.setAttribute('role', 'status');
    briefNode.innerHTML = `${icons.check}<h3>${contactText.ready}</h3><p>${contactText.readyText}</p><pre></pre><div><a href="${telegram}?text=${encodeURIComponent(brief)}" target="_blank" rel="noreferrer">${icons.send}${contactText.sendTelegram}</a><button type="button" class="copy-brief">${icons.clipboard}<span>${contactText.copy}</span></button></div><button class="contact-edit" type="button">${contactText.edit}</button>`;
    fixRuTypography(briefNode);
    briefNode.querySelector('pre').textContent = brief;
    form.replaceWith(briefNode);
    briefNode.querySelector('.copy-brief')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(brief); const label = briefNode.querySelector('.copy-brief span'); label.textContent = contactText.copied; setTimeout(() => label.textContent = contactText.copy, 1800); } catch { /* Clipboard may be unavailable on file://; the brief remains selectable. */ }
    });
    briefNode.querySelector('.contact-edit')?.addEventListener('click', () => location.reload());
  });

  const mobileLayout = matchMedia('(max-width: 767px), (max-width: 900px) and (max-height: 520px)');
  function scrollToSection(hash, behavior = 'smooth', updateHistory = true) {
    const id = decodeURIComponent(String(hash || '').replace(/^#/, ''));
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    const offset = mobileLayout.matches ? 70 : 0;
    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + scrollY - offset) + 2);
    if (updateHistory) {
      const nextHash = `#${encodeURIComponent(id)}`;
      if (location.hash !== nextHash) history.pushState(null, '', nextHash);
    }
    scrollTo({ top, behavior: reducedMotion ? 'auto' : behavior });
    return true;
  }

  main.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (!document.getElementById(decodeURIComponent(href.slice(1)))) return;
    event.preventDefault();
    setMobileMenu(false);
    scrollToSection(href, 'smooth', true);
  });

  addEventListener('popstate', () => {
    if (location.hash) scrollToSection(location.hash, 'auto', false);
  });

  const restorePageState = () => requestAnimationFrame(() => {
    setMobileMenu(false);
    layoutJourneyPath();
    renderProof();
    updateScrollEffects();
  });
  addEventListener('pageshow', restorePageState);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restorePageState();
  });

  if (location.hash) document.fonts?.ready.then(() => requestAnimationFrame(() => scrollToSection(location.hash, 'auto', false)));
  layoutJourneyPath();
  updateScrollEffects();
})();
