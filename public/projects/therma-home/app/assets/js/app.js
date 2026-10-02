/*
 * app — интерактив лендинга: header, разбор цены, фильтр кейсов,
 * блок экономики и форма вопроса инженеру.
 */
(function (global) {
  'use strict';

  var E = global.CalcEngine;
  var doc = document;

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    header();
    heroForm();
    priceStack();
    caseFilters();
    presetButtons();
    stageButtons();
    economy();
    askForm();
    motion();
  });

  /* ── Движение: прорисовка схем и появление блоков при прокрутке ── */
  function motion() {
    var heroScheme = doc.querySelector('.hero__visual .scheme');
    if (heroScheme) {
      heroScheme.classList.add('scheme--flow');
      heroScheme.querySelectorAll('.s-box, .s-label, .s-cap, .s-node').forEach(function (el, i) { el.style.setProperty('--d', String(Math.floor(i / 2))); });
    }
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in global)) return;
    if (heroScheme) heroScheme.classList.add('scheme--draw');
    doc.documentElement.classList.add('js-motion');
    var groups = ['.section__head', '.compare > article', '.stack', '.stack__details', '.solution', '.case', '.timeline > *', '.engineer', '.econ__chart', '.faq', '.final > *'];
    var targets = [];
    groups.forEach(function (selector) {
      doc.querySelectorAll(selector).forEach(function (el, i) {
        if (el.closest('.calc') || el.classList.contains('rv')) return;
        el.classList.add('rv');
        el.style.setProperty('--i', String(i % 4));
        targets.push(el);
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ── Header: тень при скролле и мобильное меню ──────────── */
  function header() {
    var el = doc.getElementById('header');
    var burger = doc.getElementById('burger');
    if (!el) return;

    var onScroll = function () { el.classList.toggle('is-stuck', global.pageYOffset > 8); };
    onScroll();
    global.addEventListener('scroll', onScroll, { passive: true });

    if (burger) {
      burger.addEventListener('click', function () {
        var open = el.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
    }
    el.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        el.classList.remove('is-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Hero: площадь → калькулятор ───────────────────────── */
  function heroForm() {
    var form = doc.getElementById('heroForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = Number(doc.getElementById('heroArea').value);
      global.Calculator.startWithArea(v >= 40 && v <= 900 ? v : null);
    });
  }

  /* ── Разбор цены: раскрытие сегментов ──────────────────── */
  function priceStack() {
    var stack = doc.getElementById('priceStack');
    var details = doc.getElementById('priceDetails');
    if (!stack || !details) return;

    var open = function (key) {
      stack.querySelectorAll('.stack__seg').forEach(function (b) {
        b.setAttribute('aria-expanded', String(b.getAttribute('data-key') === key));
      });
      details.querySelectorAll('article').forEach(function (a) {
        a.classList.toggle('is-on', a.getAttribute('data-key') === key);
      });
    };

    stack.addEventListener('click', function (e) {
      var b = e.target.closest('.stack__seg');
      if (b) open(b.getAttribute('data-key'));
    });
    open('pump');
  }

  /* ── Фильтр кейсов по площади ──────────────────────────── */
  function caseFilters() {
    var filters = doc.getElementById('caseFilters');
    var list = doc.getElementById('caseList');
    if (!filters || !list) return;

    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-active', c === b); });
      list.querySelectorAll('.case').forEach(function (c) {
        c.hidden = f !== 'all' && c.getAttribute('data-size') !== f;
      });
    });
  }

  /* ── Типовые решения → предзаполненный калькулятор ─────── */
  function presetButtons() {
    doc.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () { global.Calculator.applyPreset(b.getAttribute('data-preset')); });
    });
  }

  function stageButtons() {
    doc.querySelectorAll('[data-stage]').forEach(function (b) {
      b.addEventListener('click', function () { global.Calculator.setStage(b.getAttribute('data-stage')); });
    });
  }

  /* ── Экономика: стоимость владения за 10 лет ───────────── */
  var QUALITY = {
    good: { wall: 'aerated', thickness: 'thick',  windows: 'energy', roof: 'yes',     label: 'хорошем' },
    mid:  { wall: 'aerated', thickness: 'normal', windows: 'double', roof: 'partial', label: 'среднем' },
    poor: { wall: 'brick',   thickness: 'thin',   windows: 'old',    roof: 'no',      label: 'слабом' }
  };

  function economy() {
    var area = doc.getElementById('econArea');
    var regionSel = doc.getElementById('econRegion');
    var quality = doc.getElementById('econQuality');
    var chart = doc.getElementById('econChart');
    var out = doc.getElementById('econAreaOut');
    var note = doc.getElementById('econNote');
    if (!area || !chart) return;

    regionSel.innerHTML = E.REGIONS.map(function (r) {
      return '<option value="' + r.id + '"' + (r.id === 'moscow' ? ' selected' : '') + '>' + r.name + '</option>';
    }).join('');

    function draw() {
      var q = QUALITY[quality.value];
      var answers = {
        area: Number(area.value), floors: 2, ceiling: 2.7, stage: 'building',
        wall: q.wall, thickness: q.thickness, year: 'y2000', windows: q.windows, roof: q.roof,
        region: regionSel.value, emitters: 'mixed', existing: 'none',
        people: 4, bathrooms: 2, bath: true, power: 15, phases: 3, plans: []
      };

      var cfg = E.configure(answers);
      var est = E.estimate(cfg);
      var op = E.operation(answers, cfg);
      var own = E.ownership(answers, cfg, est, op, 10);
      var max = Math.max.apply(null, own.rows.map(function (r) { return r.total; }));

      out.value = area.value;

      chart.innerHTML = own.rows.map(function (r) {
        var w = (r.total / max) * 100;
        var capexShare = (r.capex / r.total) * w;
        var opexShare = w - capexShare;
        return '<div class="bar-row' + (r.id === 'hp' ? ' bar-row--hp' : '') + '">' +
          '<div class="bar-row__name">' + r.name +
            '<small>' + E.formatShort(r.opexYear) + '/год</small></div>' +
          '<div class="bar-row__track">' +
            '<div class="bar-row__capex" style="width:' + capexShare.toFixed(1) + '%"></div>' +
            '<div class="bar-row__opex" style="width:' + opexShare.toFixed(1) + '%"></div>' +
          '</div>' +
          '<span class="bar-row__total">' + E.formatShort(r.total) + '</span>' +
        '</div>';
      }).join('') +
      /* Две пары образцов: оранжевая — строка насоса, тёмная — альтернативы.
         С одной парой легенда описывала только один столбик из пяти. */
      '<div class="bar-legend">' +
        '<span><i style="background:var(--amber-dark)"></i><i style="background:var(--ink)"></i>Оборудование и монтаж</span>' +
        '<span><i style="background:#F0B472"></i><i style="background:#B7B4AB"></i>Топливо за 10 лет</span>' +
        '<span>Оранжевым — тепловой насос</span>' +
      '</div>';

      /* Текстовый вывод: точки окупаемости */
      var hp = own.rows[0];
      var paybacks = own.rows.slice(1).filter(function (r) { return r.payback > 0; })
        .map(function (r) { return r.name.toLowerCase() + ' — ' + String(r.payback).replace('.', ',') + ' года'; });
      var cheaper = own.rows.slice(1).filter(function (r) { return r.total > hp.total; }).length;

      note.innerHTML = 'Дом ' + area.value + ' м² в ' + q.label + ' утеплении, регион «' +
        cfg.region.name + '», теплопотери <strong class="num">' + String(Math.round(cfg.loss.kw * 10) / 10).replace('.', ',') + ' кВт</strong>. ' +
        'За 10 лет тепловой насос обходится дешевле, чем <strong>' + cheaper + ' из 4</strong> альтернатив. ' +
        (paybacks.length
          ? 'Окупаемость разницы в стоимости оборудования: ' + paybacks.join(', ') + '. '
          : 'Насос выигрывает и по вложениям, и по эксплуатации. ') +
        'Подключение магистрального газа учтено как 1,15 млн ₽ — по средней стоимости в наших регионах.';
    }

    [area, regionSel, quality].forEach(function (el) {
      el.addEventListener('input', draw);
      el.addEventListener('change', draw);
    });
    draw();
  }

  /* ── Форма вопроса инженеру ────────────────────────────── */
  function askForm() {
    var form = doc.getElementById('askForm');
    var status = doc.getElementById('askStatus');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();

      if (!name || phone.length < 6) {
        status.textContent = 'Заполните имя и телефон — иначе инженер не сможет позвонить.';
        status.className = 'form__status is-err';
        return;
      }
      if (!form.consent.checked) {
        status.textContent = 'Нужно согласие на обработку персональных данных.';
        status.className = 'form__status is-err';
        return;
      }

      status.textContent = 'Демо: поля проверены локально, но вопрос не отправлен и звонок не запланирован. Для запуска подключите CRM и уведомления.';
      status.className = 'form__status is-ok';
    });
  }
})(window);
