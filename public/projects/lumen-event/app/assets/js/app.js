/* LUMEN EVENT — поведение страницы: навигация, календарь занятости,
   появление секций, портфолио, загрузка фото, формы. */

(function (NS) {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Тост ================= */

  var toastTimer;
  NS.toast = function (text) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 4200);
  };

  /* ================= Календарь занятости =================
     Детерминированная имитация реальной загрузки бригад:
     сезон (июнь–сентябрь) и субботы разбирают заметно быстрее. */

  function loadFactor(dateStr) {
    var h = 0;
    for (var i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
    var d = new Date(dateStr + 'T12:00:00');
    var load = h % 100;
    if (d.getMonth() >= 5 && d.getMonth() <= 8) load += 26;
    if (d.getDay() === 6) load += 24;
    if (d.getDay() === 5) load += 10;
    return load;
  }

  function statusOf(dateStr) {
    var f = loadFactor(dateStr);
    if (f > 108) return 'busy';
    if (f > 82) return 'last';
    return 'free';
  }

  /* Локальный ISO без сдвига часового пояса: toISOString() увёл бы дату на сутки. */
  function isoLocal(d) {
    return [d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')].join('-');
  }

  function nearbyFree(dateStr) {
    var base = new Date(dateStr + 'T12:00:00');
    var found = [];
    for (var step = 1; step <= 21 && found.length < 2; step++) {
      [-1, 1].forEach(function (dir) {
        if (found.length >= 2) return;
        var d = new Date(base);
        d.setDate(d.getDate() + dir * step);
        if (d < new Date()) return;
        var iso = isoLocal(d);
        if (statusOf(iso) === 'free') {
          found.push(d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }));
        }
      });
    }
    return found;
  }

  function checkDate(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    if (!dateStr || isNaN(d)) return { state: '', text: '' };

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return { state: 'busy', text: 'Эта дата уже прошла' };

    var st = statusOf(dateStr);
    if (st === 'free') return { state: 'free', text: '✓ Свободно — забронируем окно на выезд' };
    if (st === 'last') return { state: 'last', text: '! Осталось одно окно на эту дату' };

    var alt = nearbyFree(dateStr);
    return {
      state: 'busy',
      text: alt.length
        ? '× Занято. Свободно ' + alt.join(' и ') + ' — предложим их'
        : '× Занято. Оставьте заявку — подберём альтернативу'
    };
  }

  function initDateChecks() {
    var todayIso = isoLocal(new Date());

    $$('[data-datecheck]').forEach(function (box) {
      var input = $('[data-datecheck-input]', box);
      var out = $('[data-datecheck-out]', box);
      if (!input || !out) return;

      input.min = todayIso;

      var run = function () {
        var res = checkDate(input.value);
        out.textContent = res.text;
        out.dataset.state = res.state;

        // Дата едина для всей страницы: синхронизируем остальные поля
        $$('[data-datecheck-input]').forEach(function (other) {
          if (other !== input && other.value !== input.value) {
            other.value = input.value;
            var oBox = other.closest('[data-datecheck]');
            var oOut = oBox && $('[data-datecheck-out]', oBox);
            if (oOut) { oOut.textContent = res.text; oOut.dataset.state = res.state; }
          }
        });

        if (NS.cfg && NS.cfg.state.date !== input.value) NS.cfg.setDate(input.value);
      };

      input.addEventListener('change', run);
      box.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    });
  }

  /* ================= Появление секций ================= */

  function initReveal() {
    var items = $$('.reveal');
    var lightAll = function () { items.forEach(function (el) { el.classList.add('is-lit'); }); };

    if (reduced || !('IntersectionObserver' in window)) { lightAll(); return; }

    // Страховка: если наблюдатель по какой-то причине не сработал,
    // контент всё равно проявляется — пустой страницы пользователь не увидит.
    var safety = setTimeout(lightAll, 3000);
    window.addEventListener('scroll', function () { clearTimeout(safety); }, { once: true, passive: true });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = Array.prototype.slice.call(entry.target.parentElement.children)
          .filter(function (n) { return n.classList.contains('reveal'); });
        var idx = siblings.indexOf(entry.target);
        entry.target.style.setProperty('--d', Math.min(idx, 6) * 70 + 'ms');
        entry.target.classList.add('is-lit');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ================= Счётчики в пруф-полосе ================= */

  function initCounters() {
    var nums = $$('[data-count]');
    if (reduced || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = +el.dataset.count;
        var start = performance.now();
        var tick = function (now) {
          var p = Math.min((now - start) / 1100, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ================= Гирлянда в hero ================= */

  function initBulbs() {
    var box = $('[data-strings]');
    if (!box || reduced) return;

    var html = '';
    var rows = [
      { top: 12, count: 26, amp: 5 },
      { top: 22, count: 20, amp: 8 },
      { top: 7, count: 16, amp: 3 }
    ];

    rows.forEach(function (row, r) {
      for (var i = 0; i < row.count; i++) {
        var x = (i / (row.count - 1)) * 100;
        var sag = Math.sin((i / (row.count - 1)) * Math.PI) * row.amp;
        html += '<i class="hero__bulb" style="left:' + x.toFixed(2) + '%;top:' +
          (row.top + sag).toFixed(2) + '%;--delay:' + (Math.random() * 4).toFixed(2) +
          's;--dur:' + (3 + Math.random() * 3).toFixed(2) + 's;opacity:' +
          (0.35 + Math.random() * 0.5).toFixed(2) + '"></i>';
      }
    });
    box.innerHTML = html;
  }

  /* ================= Шапка и навигация ================= */

  function initNav() {
    var burger = $('[data-burger]');
    var nav = $('#nav');

    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('is-locked', open);
      });
      nav.addEventListener('click', function (e) {
        if (e.target.tagName !== 'A') return;
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      });
    }

    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) io.observe(sec);
    });
  }

  /* ================= Плавающая строка итога =================
     Показываем, пока пользователь внутри конструктора, выбрана хотя бы одна
     зона, а сама панель сметы ещё не попала во вьюпорт. */

  function initCfgBar() {
    var bar = $('[data-cfgbar]');
    var section = $('#constructor');
    var estimate = $('[data-estimate]');
    if (!bar || !section || !estimate || !('IntersectionObserver' in window)) return;

    var inSection = false;
    var estimateVisible = false;

    var sync = function () {
      var hasZones = NS.cfg && NS.cfg.estimate().zones.length > 0;
      var show = inSection && hasZones && !estimateVisible;
      bar.classList.toggle('is-on', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    };

    new IntersectionObserver(function (e) {
      inSection = e[0].isIntersecting;
      sync();
    }, { threshold: 0 }).observe(section);

    new IntersectionObserver(function (e) {
      estimateVisible = e[0].isIntersecting;
      sync();
    }, { threshold: 0.15 }).observe(estimate);

    // Состояние зон меняется по клику — пересчитываем видимость после него.
    document.addEventListener('click', function () { setTimeout(sync, 0); });

    var cta = $('[data-cfgbar-cta]');
    if (cta) cta.addEventListener('click', function () { $('[data-goto-result]').click(); });
  }

  /* ================= Портфолио ================= */

  function initFolio() {
    // Слайдер «днём / вечером»
    $$('[data-ba]').forEach(function (ba) {
      var range = $('.ba__range', ba);
      var apply = function () { ba.style.setProperty('--split', range.value + '%'); };
      range.addEventListener('input', apply);
      apply();

      // Атмосфера кейса задаёт цвет вечернего кадра
      var card = ba.closest('[data-mood]');
      if (card && window.LUMEN.ATMOSPHERES) {
        var a = NS.ATMOSPHERES.filter(function (m) { return m.id === card.dataset.mood; })[0];
        if (a) {
          ba.style.setProperty('--accent', a.palette[0]);
          ba.style.setProperty('--accent-2', a.palette[1]);
          ba.style.setProperty('--accent-3', a.palette[2]);
        }
      }
    });

    // Фильтры
    var filters = $('[data-folio-filters]');
    if (filters) {
      filters.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter]');
        if (!btn) return;
        $$('[data-filter]', filters).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var f = btn.dataset.filter;
        $$('.case').forEach(function (c) {
          c.classList.toggle('is-hidden', f !== 'all' && c.dataset.type !== f);
        });
      });
    }

    // «Хочу так же» — переносит атмосферу кейса в конструктор
    $$('[data-preset]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (NS.cfg) NS.cfg.setMood(a.dataset.preset);
        NS.toast('Атмосфера кейса перенесена в конструктор — соберите зоны');
      });
    });
  }

  /* ================= Загрузка фото площадки ================= */

  function initDropzone() {
    var dz = $('[data-dropzone]');
    if (!dz) return;
    var input = $('[data-dropzone-input]', dz);
    var list = $('[data-dropzone-files]', dz);

    var show = function (files) {
      var picked = Array.prototype.slice.call(files).slice(0, 5);
      if (!picked.length) return;
      list.innerHTML = picked.map(function (f) {
        var kb = Math.round(f.size / 1024);
        return '<li>' + f.name + ' · ' + (kb > 1024 ? (kb / 1024).toFixed(1) + ' МБ' : kb + ' КБ') + '</li>';
      }).join('');
      NS.toast('Файлы приняты. Эскиз со светом вернём в течение 24 часов — оставьте контакт в форме ниже');
    };

    dz.addEventListener('click', function (e) {
      if (e.target !== input) input.click();
    });
    dz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () { show(input.files); });

    ['dragenter', 'dragover'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); });
    });
    dz.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) show(e.dataTransfer.files);
    });
  }

  /* ================= Формы ================= */

  function initForms() {
    var handle = function (sel, label) {
      var form = $(sel);
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        NS.toast('Демо: ' + label + ' собран локально, но не отправлен. CRM и уведомления не подключены');
      });
    };

    handle('[data-lead-form]', 'бриф');
    handle('[data-final-form]', 'запрос');
    handle('[data-b2b-form]', 'B2B-запрос');

    var email = $('[data-mb-email]');
    if (email) {
      email.addEventListener('click', function () {
        var hint = $('[data-result-hint]');
        var value = prompt('На какую почту прислать moodboard и смету?');
        if (!value) return;
        if (hint) hint.textContent = 'Демо: адрес ' + value + ' проверен локально, письмо не отправлено';
        NS.toast('Демо: отправка почты не подключена. Используйте кнопку «Поделиться ссылкой»');
      });
    }

    var share = $('[data-mb-share]');
    if (share) {
      share.addEventListener('click', function () {
        var url = buildShareUrl();
        var done = function () {
          NS.toast('Ссылка на конфигурацию скопирована — можно отправить второй половине или руководителю');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { prompt('Скопируйте ссылку:', url); });
        } else {
          prompt('Скопируйте ссылку:', url);
        }
      });
    }
  }

  /* ================= Обмен конфигурацией по ссылке ================= */

  function buildShareUrl() {
    var s = NS.cfg.state;
    var zones = Object.keys(s.zones)
      .filter(function (id) { return s.zones[id].on; })
      .map(function (id) { return id + ':' + s.zones[id].tier; })
      .join(',');

    var p = new URLSearchParams();
    p.set('mood', s.mood);
    if (s.moodSecond) p.set('mood2', s.moodSecond);
    if (s.date) p.set('date', s.date);
    p.set('guests', s.guests);
    p.set('budget', s.budget);
    if (zones) p.set('z', zones);

    return location.origin + location.pathname + '?' + p.toString() + '#result';
  }

  function applySharedConfig() {
    var p = new URLSearchParams(location.search);
    if (!p.toString() || !NS.cfg) return;

    var s = NS.cfg.state;
    var touched = false;

    if (p.get('mood')) { s.mood = p.get('mood'); touched = true; }
    if (p.get('mood2')) { s.moodSecond = p.get('mood2'); touched = true; }
    if (p.get('date')) { s.date = p.get('date'); touched = true; }
    if (p.get('guests')) { s.guests = p.get('guests'); touched = true; }
    if (p.get('budget')) { s.budget = +p.get('budget'); touched = true; }

    if (p.get('z')) {
      Object.keys(s.zones).forEach(function (id) { s.zones[id].on = false; });
      p.get('z').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        if (s.zones[parts[0]]) {
          s.zones[parts[0]].on = true;
          if (parts[1]) s.zones[parts[0]].tier = parts[1];
        }
      });
      touched = true;
    }

    if (!touched) return;

    $$('[data-datecheck-input]').forEach(function (i) { if (s.date) i.value = s.date; });
    NS.cfg.update();

    var res = $('[data-result]');
    if (res && Object.keys(s.zones).some(function (id) { return s.zones[id].on; })) {
      res.hidden = false;
    }
    NS.toast('Открыта конфигурация из ссылки — её можно менять дальше');
  }

  /* ================= Старт ================= */

  initBulbs();
  initNav();
  initDateChecks();
  initFolio();
  initDropzone();
  initForms();

  if (NS.cfg) NS.cfg.init();
  applySharedConfig();
  initCfgBar();

  initReveal();
  initCounters();
})(window.LUMEN);
