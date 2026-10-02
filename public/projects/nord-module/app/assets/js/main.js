/* NORD MODULE — интерактив лендинга */

(function (NM) {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Перерисовка чертежей после смены ширины окна: кегль подписей зависит от неё */
  function onResize(fn) {
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(fn, 180);
    });
  }

  function init() {
    NM.conf.restore();

    header();
    heroScene();
    counters();
    purposeGrid();
    modelsGrid();
    baseLists();
    compareSlider();
    sizeSection();
    NM.mountPreview($('[data-preview]'));
    deliverySection();
    projects();
    reviews();
    wallSection();
    faq();
    quiz();
    stickyCta();
    openTriggers();
    reveal();
    restoredNotice();
  }

  /* ============ Шапка ============ */

  function header() {
    var el = $('#header');
    var burger = $('.burger');
    var nav = $('.nav');

    var onScroll = function () {
      el.classList.toggle('is-stuck', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    burger.addEventListener('click', function () {
      var open = el.classList.toggle('is-nav-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        el.classList.remove('is-nav-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============ Главный экран ============ */

  function heroScene() {
    var el = $('[data-hero-scene]');
    if (!el) return;
    var cfg = Object.assign(NM.defaultConfig(), {
      purpose: 'guest', model: 'l', facade: 'planken',
      glazing: 'panoramic', terrace: 'canopy_l', foundation: 'piles'
    });
    el.innerHTML = NM.photo('hero', null, true);
  }

  /* ============ Счётчики ============ */

  function counters() {
    var items = $$('[data-count]');
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { io.observe(el); });

    function animate(el) {
      var target = parseInt(el.dataset.count, 10);
      var suffix = el.dataset.suffix || '';
      if (el.dataset.literal != null) { el.textContent = el.dataset.literal + suffix; return; }
      var start = performance.now(), dur = 1100;
      (function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
  }

  /* ============ Назначения ============ */

  var PURPOSE_ICONS = {
    desk: '<path d="M4 8h24M6 8v14M26 8v14M10 14h12M10 14v4M22 14v4" />',
    sauna: '<path d="M5 26V12l11-6 11 6v14M5 26h22M11 20h10M13 12c0 2-2 2-2 4M19 12c0 2-2 2-2 4" />',
    bed: '<path d="M4 24v-9h24v9M4 20h24M4 24v2M28 24v2M8 15v-4h8v4" />',
    home: '<path d="M5 26V13l11-8 11 8v13H5zM13 26v-8h6v8" />'
  };

  function purposeGrid() {
    var grid = $('[data-purpose-grid]');
    grid.innerHTML = NM.PURPOSES.map(function (p) {
      var models = NM.MODELS.filter(function (m) { return m.purposes.indexOf(p.id) !== -1; });
      var from = Math.min.apply(null, models.map(function (m) { return m.base; }));
      return '<button type="button" class="purpose" data-purpose="' + p.id + '">' +
        '<span class="purpose__icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PURPOSE_ICONS[p.icon] + '</svg></span>' +
        '<span class="purpose__title">' + p.title + '</span>' +
        '<span class="purpose__tagline">' + p.tagline + '</span>' +
        '<span class="purpose__desc">' + p.desc + '</span>' +
        '<span class="purpose__foot"><em>от ' + NM.price(from) + '</em><i>Собрать →</i></span>' +
        '</button>';
    }).join('');

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-purpose]');
      if (!btn) return;
      NM.conf.set('purpose', btn.dataset.purpose);
      NM.conf.goStage(0);
      NM.openConfigurator('purpose-card');
    });
  }

  /* ============ Модельный ряд ============ */

  function modelsGrid() {
    var grid = $('[data-models]');
    grid.innerHTML = NM.MODELS.map(function (m) {
      var cfg = Object.assign(NM.defaultConfig(), {
        purpose: m.purposes[0], model: m.id, glazing: 'large', interior: 'light'
      });
      return '<article class="model" data-plan-for="' + m.id + '">' +
        '<div class="model__plan"><div class="model__planbox"></div>' +
          '<p class="model__plannote">' + NM.svg.planCaption(cfg) + '</p></div>' +
        '<div class="model__body">' +
          '<h3 class="model__name">' + m.name + ' <span>«' + m.sub + '»</span></h3>' +
          '<p class="model__dims">' + m.area + ' м² · ' + m.len.toFixed(1).replace('.', ',') + ' × ' +
            m.depth.toFixed(1).replace('.', ',') + ' м · ' + m.capacity + '</p>' +
          '<p class="model__about">' + m.about + '</p>' +
          '<p class="model__compare"><b>Для ощущения масштаба:</b> ' + m.compare.toLowerCase() + '</p>' +
          '<div class="model__foot">' +
            '<div class="model__price"><span>Базовая цена под ключ</span><b>' + NM.price(m.base) + '</b>' +
            '<em>8 позиций входят всегда</em></div>' +
            '<button type="button" class="btn btn--primary" data-model="' + m.id + '">Конфигурировать</button>' +
          '</div>' +
        '</div></article>';
    }).join('');

    /* Планы вставляем после разметки: рендеру нужна фактическая ширина контейнера,
       чтобы подобрать кегль подписей. */
    function drawPlans() {
      $$('[data-plan-for]', grid).forEach(function (card) {
        var m = NM.modelById(card.dataset.planFor);
        var cfg = Object.assign(NM.defaultConfig(), {
          purpose: m.purposes[0], model: m.id, glazing: 'large', interior: 'light'
        });
        NM.svg.renderPlanInto($('.model__planbox', card), cfg, { tight: true });
      });
    }
    drawPlans();
    onResize(drawPlans);

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-model]');
      if (!btn) return;
      var m = NM.modelById(btn.dataset.model);
      NM.conf.patch({ purpose: m.purposes[0], model: m.id });
      NM.conf.goStage(1);
      NM.openConfigurator('model-card');
    });
  }

  /* ============ Что входит в базу ============ */

  function baseLists() {
    $('[data-base-included]').innerHTML = NM.BASE_INCLUDED.map(function (item) {
      return '<li class="price__item"><b>' + item.title + '</b><span>' + item.desc + '</span></li>';
    }).join('');

    $('[data-base-excluded]').innerHTML = NM.BASE_EXCLUDED.map(function (title) {
      return '<li class="price__item price__item--out"><b>' + title + '</b></li>';
    }).join('');
  }

  /* ============ Слайдер «база ↔ максимум» ============ */

  function compareSlider() {
    var stage = $('[data-compare]');
    if (!stage) return;

    var base = Object.assign(NM.defaultConfig(), { purpose: 'living', model: 'l', distance: 40 });
    var max = NM.maxConfig();

    $('[data-compare-a]').innerHTML = NM.photo('compare-base');
    $('[data-compare-b]').innerHTML = NM.photo('compare-max');
    $('[data-compare-price-a]').textContent = NM.price(NM.calc(base).total);
    $('[data-compare-price-b]').textContent = NM.price(NM.calc(max).total);

    var layerB = $('[data-compare-b]');
    var handle = $('[data-compare-handle]');
    var range = $('[data-compare-range]');

    function apply(pct) {
      pct = Math.max(0, Math.min(100, pct));
      layerB.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      handle.style.left = pct + '%';
      range.value = pct;
    }
    apply(50);

    range.addEventListener('input', function () { apply(parseFloat(range.value)); });

    var dragging = false;
    function fromEvent(e) {
      var rect = stage.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      apply((x / rect.width) * 100);
    }
    stage.addEventListener('mousedown', function (e) { dragging = true; fromEvent(e); });
    window.addEventListener('mousemove', function (e) { if (dragging) fromEvent(e); });
    window.addEventListener('mouseup', function () { dragging = false; });
    stage.addEventListener('touchstart', function (e) { fromEvent(e); }, { passive: true });
    stage.addEventListener('touchmove', function (e) { fromEvent(e); }, { passive: true });
  }

  /* ============ Реальные размеры ============ */

  function sizeSection() {
    var tabs = $('[data-size-tabs]');
    var planEl = $('[data-size-plan]');
    var cmpEl = $('[data-size-compare]');
    var metaEl = $('[data-size-meta]');
    var current = 's';

    tabs.innerHTML = NM.MODELS.map(function (m) {
      return '<button type="button" role="tab" class="size__tab" data-size-model="' + m.id + '">' +
        m.name + ' <em>' + m.area + ' м²</em></button>';
    }).join('');

    function render() {
      var m = NM.modelById(current);
      var cfg = Object.assign(NM.defaultConfig(), {
        purpose: m.purposes[0], model: m.id, glazing: 'large',
        furniture: 'full', bathroom: m.area >= 24 ? 'full' : 'compact', kitchen: m.area >= 24 ? 'full' : 'mini'
      });
      planEl.innerHTML = '<div class="size__planbox"></div><p class="size__plannote">' + NM.svg.planCaption(cfg) + '</p>';
      NM.svg.renderPlanInto($('.size__planbox', planEl), cfg, {});
      NM.svg.renderInto(cmpEl, function (o) { return NM.svg.compare(m.id, o); });
      metaEl.innerHTML =
        '<div class="size__fact"><b>' + m.compare + '</b><span>чтобы почувствовать площадь</span></div>' +
        '<div class="size__fact"><b>' + m.capacity + '</b><span>комфортная вместимость</span></div>' +
        '<div class="size__fact"><b>' + (m.height).toFixed(1).replace('.', ',') + ' м</b><span>высота модуля снаружи</span></div>' +
        '<button type="button" class="btn btn--primary" data-open-cfg="size">Собрать ' + m.name + '</button>';
      $$('[data-size-model]', tabs).forEach(function (b) {
        b.classList.toggle('is-on', b.dataset.sizeModel === current);
        b.setAttribute('aria-selected', String(b.dataset.sizeModel === current));
      });
    }

    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-size-model]');
      if (!btn) return;
      current = btn.dataset.sizeModel;
      render();
    });
    onResize(render);

    metaEl.addEventListener('click', function (e) {
      if (!e.target.closest('[data-open-cfg]')) return;
      NM.conf.patch({ purpose: NM.modelById(current).purposes[0], model: current });
    });

    render();
  }

  /* ============ Доставка ============ */

  function deliverySection() {
    var scene = $('[data-delivery-scene]');
    var access = {};
    var drawScene = function () { NM.svg.renderInto(scene, function (o) { return NM.svg.delivery(Object.assign({ access: access }, o)); }); };
    NM.accessChecker($('[data-access-check]'), { showCta: true, onChange: function (next) { access = next; drawScene(); } });
    drawScene();
    onResize(drawScene);
  }

  /* ============ Проекты ============ */

  function projects() {
    var grid = $('[data-projects]');
    var filter = $('[data-projects-filter]');
    var active = 'all';

    var groups = [{ id: 'all', title: 'Все проекты' }].concat(
      NM.PURPOSES.map(function (p) { return { id: p.id, title: p.title }; })
    );
    filter.innerHTML = groups.map(function (g) {
      return '<button type="button" class="chip' + (g.id === 'all' ? ' is-on' : '') + '" data-filter="' + g.id + '">' + g.title + '</button>';
    }).join('');

    function card(p) {
      var res = NM.calc(p.config);
      var m = NM.modelById(p.config.model);
      var terr = NM.svg.TERRACES[p.config.terrace];
      var chips = [
        m.name + ' · ' + m.area + ' м²',
        NM.findOption(NM.stepById('facade'), p.config.facade).title,
        NM.findOption(NM.stepById('glazing'), p.config.glazing).title + ' остекление',
        terr ? 'Терраса ' + terr.label : 'Без террасы',
        p.config.bathroom === 'none' ? 'Без санузла' : NM.findOption(NM.stepById('bathroom'), p.config.bathroom).title
      ];
      return '<article class="project" data-purpose-tag="' + p.config.purpose + '">' +
        '<div class="project__scene">' + NM.photo(p.photo, p.title) + '</div>' +
        '<div class="project__body">' +
          '<h3 class="project__title">' + p.title + '</h3>' +
          '<p class="project__meta">' + p.meta + '</p>' +
          '<p class="project__story">' + p.story + '</p>' +
          '<ul class="project__chips">' + chips.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' +
          '<div class="project__foot">' +
            '<div class="project__price"><span>Итоговая цена договора</span><b>' + NM.price(res.total) + '</b></div>' +
            '<button type="button" class="btn btn--outline" data-repeat="' + p.id + '">Повторить конфигурацию</button>' +
          '</div>' +
        '</div></article>';
    }

    function render() {
      grid.innerHTML = NM.PROJECTS
        .filter(function (p) { return active === 'all' || p.config.purpose === active; })
        .map(card).join('');
      if (!grid.children.length) {
        grid.innerHTML = '<p class="projects__empty">В этой категории пока нет опубликованных проектов — но модули такого назначения мы делаем. Соберите свой в конфигураторе.</p>';
      }
    }

    filter.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      active = btn.dataset.filter;
      $$('[data-filter]', filter).forEach(function (b) { b.classList.toggle('is-on', b.dataset.filter === active); });
      render();
    });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-repeat]');
      if (!btn) return;
      var project = NM.PROJECTS.filter(function (p) { return p.id === btn.dataset.repeat; })[0];
      if (!project) return;
      NM.conf.replace(project.config);
      NM.conf.goStage(0);
      NM.track('config_preset', { project: project.id });
      NM.openConfigurator('project-repeat');
    });

    render();
  }

  /* ============ Отзывы ============ */

  function reviews() {
    $('[data-reviews]').innerHTML = NM.REVIEWS.map(function (r) {
      return '<figure class="review">' +
        '<blockquote>«' + r.text + '»</blockquote>' +
        '<figcaption><b>' + r.name + '</b><span>' + r.role + '</span></figcaption>' +
        '<div class="review__metric">' + r.metric + '</div>' +
        '</figure>';
    }).join('');
  }

  /* ============ Разрез стены ============ */

  function wallSection() {
    var stage = $('[data-wall-stage]');
    var list = $('[data-wall-list]');
    var active = null;

    function render() {
      NM.svg.renderInto(stage, function (o) { return NM.svg.wall(active, o); });
      list.innerHTML = NM.WALL_LAYERS.map(function (l, i) {
        return '<button type="button" class="wall__item' + (i === active ? ' is-on' : '') + '" data-layer="' + i + '">' +
          '<b>' + l.title + '</b><em>' + l.thickness + '</em><span>' + l.desc + '</span></button>';
      }).join('');
    }

    function select(i) { active = active === i ? null : i; render(); }

    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-layer]');
      if (b) select(parseInt(b.dataset.layer, 10));
    });
    list.addEventListener('mouseover', function (e) {
      var b = e.target.closest('[data-layer]');
      if (b) { active = parseInt(b.dataset.layer, 10); render(); }
    });
    stage.addEventListener('click', function (e) {
      var r = e.target.closest('.wall-layer');
      if (r) select(parseInt(r.dataset.index, 10));
    });

    render();
    onResize(render);
  }

  /* ============ FAQ ============ */

  function faq() {
    var root = $('[data-faq]');
    root.innerHTML = NM.FAQ.map(function (group) {
      return '<div class="faq__group">' +
        '<h3 class="faq__gtitle">' + group.group + '</h3>' +
        group.items.map(function (item) {
          return '<details class="faq__item"><summary>' + item.q +
            '<span class="faq__mark" aria-hidden="true"></span></summary>' +
            '<div class="faq__answer"><p>' + item.a + '</p></div></details>';
        }).join('') + '</div>';
    }).join('');

    /* Разметка для расширенного сниппета в поиске */
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: NM.FAQ.reduce(function (acc, g) {
        return acc.concat(g.items.map(function (i) {
          return { '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } };
        }));
      }, [])
    };
    var tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(schema);
    document.head.appendChild(tag);
  }

  /* ============ Квиз «соберите за меня» ============ */

  function quiz() {
    var form = $('[data-quiz]');
    var stepEl = $('[data-quiz-step]', form);
    var navEl = $('[data-quiz-nav]', form);

    var questions = [
      {
        id: 'purpose', title: 'Что вам нужно?',
        options: NM.PURPOSES.map(function (p) { return { id: p.id, title: p.title }; })
      },
      {
        id: 'budget', title: 'На какой бюджет ориентируетесь?',
        options: [
          { id: 'a', title: 'До 1,5 млн ₽' },
          { id: 'b', title: '1,5–2,5 млн ₽' },
          { id: 'c', title: '2,5–3,5 млн ₽' },
          { id: 'd', title: 'Больше 3,5 млн ₽' }
        ]
      },
      {
        id: 'when', title: 'Когда планируете поставить?',
        options: [
          { id: 'now', title: 'В ближайшие 2 месяца' },
          { id: 'season', title: 'В этом сезоне' },
          { id: 'later', title: 'Пока изучаю' }
        ]
      }
    ];

    var index = 0;
    var answers = {};

    function render() {
      if (index < questions.length) {
        var q = questions[index];
        stepEl.innerHTML = '<p class="quiz__count">Вопрос ' + (index + 1) + ' из ' + questions.length + '</p>' +
          '<h4 class="quiz__title">' + q.title + '</h4>' +
          '<div class="quiz__opts">' + q.options.map(function (o) {
            return '<button type="button" class="quiz__opt' + (answers[q.id] === o.id ? ' is-on' : '') + '" data-q="' + q.id + '" data-o="' + o.id + '">' + o.title + '</button>';
          }).join('') + '</div>';
        navEl.innerHTML = index > 0 ? '<button type="button" class="btn btn--ghost btn--sm" data-quiz-back>Назад</button>' : '';
      } else {
        stepEl.innerHTML = '<p class="quiz__count">Последний шаг</p>' +
          '<h4 class="quiz__title">Подборка готова для демо</h4>' +
          '<p>Контакты не нужны: в этой версии результат показывается локально и никуда не отправляется.</p>';
        navEl.innerHTML = '<button type="button" class="btn btn--ghost btn--sm" data-quiz-back>Назад</button>' +
          '<button type="submit" class="btn btn--primary">Показать результат</button>';
      }
    }

    form.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-q]');
      if (opt) {
        answers[opt.dataset.q] = opt.dataset.o;
        if (opt.dataset.q === 'purpose') NM.conf.set('purpose', opt.dataset.o);
        index++;
        render();
        return;
      }
      if (e.target.closest('[data-quiz-back]')) { index = Math.max(0, index - 1); render(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      NM.track('quiz_demo_complete', answers);
      form.innerHTML = '<div class="quiz__done"><div class="quiz__mark">✓</div>' +
        '<h4>Демо-подборка собрана</h4><p>Ответы сохранены только на этой странице. Для реального сервиса здесь нужно показать 2–3 рассчитанные конфигурации или подключить CRM.</p></div>';
    });

    render();
  }

  /* ============ Плавающая кнопка ============ */

  function stickyCta() {
    var el = $('[data-sticky]');
    var price = $('[data-sticky-price]');

    NM.conf.subscribe(function () {
      price.textContent = 'от ' + NM.price(NM.calc().total);
    });

    /* Кнопка прячется рядом с блоками, где своя главная кнопка уже на виду —
       иначе она просто перекрывает их содержимое. */
    /* Не .map($): $ принимает вторым аргументом контекст, и туда попал бы индекс из map */
    var quiet = ['.hero', '#configurator', '#start']
      .map(function (sel) { return $(sel); })
      .filter(Boolean);
    var visible = new Set();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      });
      el.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.15 });
    quiet.forEach(function (t) { io.observe(t); });
  }

  /* ============ Кнопки открытия конфигуратора ============ */

  function openTriggers() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-open-cfg]');
      if (!btn) return;
      NM.openConfigurator(btn.dataset.openCfg);
    });

    var openFromHash = function (source) {
      var match = /[#&]c=([^&]+)/.exec(location.hash);
      if (!match) return false;
      var cfg = NM.conf.decode(decodeURIComponent(match[1]));
      if (!cfg) return false;
      NM.conf.replace(cfg);
      NM.openConfigurator(source);
      NM.conf.goStage(NM.STAGES.length);
      return true;
    };

    openFromHash('shared-link');

    /* Ссылку могут вставить в уже открытую вкладку — документ при этом не перезагружается */
    window.addEventListener('hashchange', function () { openFromHash('shared-link-hashchange'); });
  }

  /* ============ Появление секций ============ */

  function reveal() {
    var targets = $$('.section__head, .purpose, .model, .price__col, .compare, .project, .review, .tech__card, .timeline li, .final__card');
    if (!('IntersectionObserver' in window)) { targets.forEach(function (t) { t.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add('is-in'); }, Math.min(i * 60, 240));
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    targets.forEach(function (t) { t.classList.add('reveal'); io.observe(t); });
  }

  /* ============ Уведомление о восстановленной конфигурации ============ */

  function restoredNotice() {
    if (!NM.restoredFromStorage && !NM.restoredFromLink) return;
    var res = NM.calc();
    var note = document.createElement('div');
    note.className = 'notice';
    note.innerHTML = '<div class="notice__body">' +
      '<b>' + (NM.restoredFromLink ? 'Открыта сохранённая конфигурация' : 'С возвращением') + '</b>' +
      '<span>' + res.model.name + ' «' + res.model.sub + '» на ' + NM.price(res.total) +
      (NM.restoredFromLink ? ' — по вашей ссылке.' : ' — мы сохранили вашу сборку.') + '</span></div>' +
      '<button type="button" class="notice__cta" data-open-cfg="restored">Продолжить</button>' +
      '<button type="button" class="notice__close" aria-label="Закрыть">×</button>';
    document.body.appendChild(note);
    requestAnimationFrame(function () { note.classList.add('is-in'); });
    note.addEventListener('click', function (e) {
      if (e.target.closest('.notice__close') || e.target.closest('[data-open-cfg]')) note.remove();
    });
    setTimeout(function () { note.classList.remove('is-in'); }, 12000);
  }

  /* Запуск в самом низу модуля: init() обращается к константам, объявленным выше по файлу.
     Проверяем readyState — скрипт может выполниться и после готовности документа. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window.NM);
