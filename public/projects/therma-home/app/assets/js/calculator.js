/*
 * calculator — пошаговый мастер расчёта и экран результата.
 * Состояние хранится в localStorage и сериализуется в URL.
 */
(function (global) {
  'use strict';

  var E = global.CalcEngine;
  var STORE_KEY = 'therma:calc:v1';

  var els = {};
  var state = {
    step: 0,
    reached: 0,     // самый дальний посещённый шаг: живая панель не должна
                    // выдавать значения по умолчанию за ответы пользователя
    submitted: false,
    result: null,
    a: defaults()
  };

  function defaults() {
    return {
      area: 160, floors: 2, ceiling: 2.7, stage: null,
      wall: null, thickness: null, year: null, windows: null, roof: null,
      region: 'moscow',
      emitters: null, existing: null,
      people: 3, bathrooms: 1, bath: true,
      power: null, phases: null,
      plans: [],
      name: '', phone: '', email: '', slot: '', consent: false
    };
  }

  /* ── Определение шагов ─────────────────────────────────── */
  var STEPS = [
    { id: 'house',    label: 'Дом',        render: rHouse,    valid: vHouse },
    { id: 'envelope', label: 'Утепление',  render: rEnvelope, valid: vEnvelope },
    { id: 'region',   label: 'Регион',     render: rRegion,   valid: function () { return !!state.a.region; } },
    { id: 'loops',    label: 'Контуры',    render: rLoops,    valid: vLoops },
    { id: 'dhw',      label: 'Горячая вода', render: rDhw,    valid: function () { return !!state.a.people; } },
    { id: 'power',    label: 'Электрика',  render: rPower,    valid: vPower },
    { id: 'plan',     label: 'План дома',  render: rPlan,     valid: function () { return true; }, optional: true },
    { id: 'contact',  label: 'Результат',  render: rContact,  valid: vContact }
  ];

  /* ── Инициализация ─────────────────────────────────────── */
  function init() {
    els.root = document.getElementById('calcRoot');
    if (!els.root) return;
    els.progress = document.getElementById('calcProgress');
    els.main = document.getElementById('calcMain');
    els.live = document.getElementById('calcLive');
    els.nav = document.getElementById('calcNav');
    els.result = document.getElementById('calcResult');

    restore();
    els.main.addEventListener('click', onMainClick);
    els.main.addEventListener('input', onMainInput);
    els.main.addEventListener('change', onMainInput);
    els.main.addEventListener('keydown', onMainKeydown);
    els.main.addEventListener('dragover', onDragOver);
    els.main.addEventListener('dragleave', onDragLeave);
    els.main.addEventListener('drop', onDrop);
    els.progress.addEventListener('click', onProgressClick);
    els.nav.addEventListener('click', onNavClick);
    els.result.addEventListener('click', onResultClick);

    render();
  }

  /* ── Хранение состояния ────────────────────────────────── */
  function persist() {
    try {
      var copy = JSON.parse(JSON.stringify(state.a));
      copy.plans = state.a.plans.map(function (f) { return { name: f.name, size: f.size }; });
      localStorage.setItem(STORE_KEY, JSON.stringify({ step: state.step, reached: state.reached, a: copy }));
    } catch (e) { /* приватный режим — работаем без сохранения */ }
  }

  function restore() {
    var hash = global.location.hash;
    if (hash.indexOf('#calc=') === 0) {
      try {
        var decoded = JSON.parse(decodeURIComponent(atob(hash.slice(6))));
        state.a = merge(defaults(), decoded);
        state.a.plans = [];
        state.step = STEPS.length - 1;
        state.reached = STEPS.length - 1;
        return;
      } catch (e) { /* битая ссылка — начинаем заново */ }
    }
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      state.a = merge(defaults(), saved.a || {});
      state.a.plans = [];
      state.step = Math.min(saved.step || 0, STEPS.length - 1);
      state.reached = Math.min(Math.max(saved.reached || 0, state.step), STEPS.length - 1);
    } catch (e) { /* нет доступа к localStorage */ }
  }

  function merge(base, over) {
    Object.keys(over).forEach(function (k) { if (over[k] !== null && over[k] !== undefined) base[k] = over[k]; });
    return base;
  }

  function shareLink() {
    var copy = JSON.parse(JSON.stringify(state.a));
    delete copy.plans; delete copy.name; delete copy.phone; delete copy.email; delete copy.consent; delete copy.slot;
    var payload = btoa(encodeURIComponent(JSON.stringify(copy)));
    return global.location.href.split('#')[0] + '#calc=' + payload;
  }

  /* ── Рендер ────────────────────────────────────────────── */
  function render() {
    if (state.submitted) {
      els.root.classList.add('is-hidden');
      renderResult();
      return;
    }
    els.root.classList.remove('is-hidden');
    els.result.hidden = true;
    state.reached = Math.max(state.reached, state.step);
    renderProgress();
    els.main.innerHTML = STEPS[state.step].render();
    renderLive();
    renderNav();
    persist();
  }

  function renderProgress() {
    els.progress.innerHTML = STEPS.map(function (s, i) {
      var cls = i === state.step ? 'is-current' : i < state.step ? 'is-done' : '';
      var reachable = i <= state.step;
      return '<button class="calc__step ' + cls + '" data-step="' + i + '"' + (reachable ? '' : ' disabled') + '>' +
        '<b>' + (i === STEPS.length - 1 ? '★' : pad(i + 1)) + '</b>' + s.label + '</button>';
    }).join('');
  }

  function renderNav() {
    var step = STEPS[state.step];
    var last = state.step === STEPS.length - 1;
    var ok = step.valid();
    /* Считаем только шаги-вопросы: последний экран — результат, а не вопрос.
       Иначе счётчик противоречит обещанию «7 шагов» в hero. */
    var questions = STEPS.length - 1;
    var left = state.step > 0
      ? '<button class="link-btn" data-act="back">← Назад</button>'
      : '<span class="calc__count">шаг 1 из ' + questions + '</span>';
    var skip = step.optional ? '<button class="link-btn" data-act="skip">Пропустить шаг</button>' : '';
    var right = last
      ? '<button class="btn btn--primary" data-act="submit"' + (ok ? '' : ' disabled') + '>Показать расчёт и получить PDF</button>'
      : '<button class="btn btn--primary" data-act="next"' + (ok ? '' : ' disabled') + '>Далее</button>';

    els.nav.innerHTML =
      '<div class="calc__nav-side">' + left + '</div>' +
      '<div class="calc__nav-side">' +
        (state.step > 0 && !last ? '<span class="calc__count">шаг ' + (state.step + 1) + ' из ' + questions + '</span>' : '') +
        skip + right +
      '</div>';
  }

  /* ── Живая панель ──────────────────────────────────────── */
  function renderLive() {
    var a = state.a;
    var known = a.wall && a.region;
    var loss = known ? E.heatLoss(a) : null;
    var cfg = (known && a.emitters) ? E.configure(a) : null;
    /* Число жильцов имеет значение по умолчанию, поэтому объём бойлера
       показываем только когда шаг про горячую воду действительно пройден. */
    var dhwAsked = state.reached >= stepIndex('dhw');

    var rows = [
      ['Площадь', a.area ? a.area + ' м²' : '—'],
      ['Утепление', loss ? loss.label + ', ' + loss.q + ' Вт/м²' : '—'],
      ['Расчётная t', a.region ? E.formatTemp(region(a.region).tOut) : '—'],
      ['Теплопотери', loss ? fmt(loss.kw) + ' кВт' : '—'],
      ['Контуры', a.emitters ? emitterLabel(a.emitters) : '—'],
      ['Бойлер ГВС', dhwAsked ? volume(a) + ' л' : '—']
    ];

    var html = '<p class="live__title">Ваша система</p>' +
      '<div class="live__scheme">' + liveScheme(cfg, dhwAsked) + '</div>' +
      '<div class="live__rows">' + rows.map(function (r) {
        return '<div class="live__row' + (r[1] === '—' ? ' is-empty' : '') + '"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
      }).join('') + '</div>';

    if (cfg) {
      html += '<div class="live__est"><span>Предварительно</span>' +
        '<strong>' + cfg.typeLabel + ', ' + cfg.power + ' кВт</strong>' +
        '<small>' + (cfg.hybrid ? 'гибридная схема с вашим котлом' : cfg.peakHeater ? 'с пиковым доводчиком' : 'без доводчика') + '</small></div>';
    } else {
      html += '<div class="live__est"><span>Предварительно</span>' +
        '<small>конфигурация появится после шага «Контуры»</small></div>';
    }
    els.live.innerHTML = html;
  }

  /* Разрез дома в live-панели: каждый ответ мастера меняет чертёж — площадь и высота, материал и
     толщина стен, окна, кровля, регион, контуры, горячая вода, котёл и электрика. Узлы, которых
     ещё не было, появляются с анимацией; стрелки теплопотерь показывают, куда уходит тепло. */
  var liveSeen = {};
  function liveScheme(cfg, dhwAsked) {
    var a = state.a;
    var region = E.REGIONS.filter(function (r) { return r.id === a.region; })[0];
    var floors = Math.min(3, Math.max(1, Number(a.floors) || 1));
    var storey = ({ '2.7': 30, '3.5': 37, '4.5': 46 })[String(a.ceiling)] || 30;
    var ground = 182, unitX = 8;
    var width = Math.round(Math.min(196, Math.max(104, 100 + (Math.sqrt(a.area || 100) - 6) * 4.2)));
    var left = 66 + Math.round((196 - width) / 2), right = left + width;
    var top = ground - storey * floors;
    var roofTop = top - 24;
    var wallT = ({ thin: 3, normal: 5, thick: 5 })[a.thickness] || 4;
    var facade = a.thickness === 'thick' ? 4 : 0;
    var mid = (left + right) / 2;
    var parts = [];
    function part(key, visible, body) {
      if (!visible) return;
      parts.push('<g class="s-part' + (liveSeen[key] ? '' : ' s-part--new') + '">' + body + '</g>');
      liveSeen[key] = true;
    }
    function each(fn) { var out = ''; for (var i = 0; i < floors; i++) out += fn(ground - storey * (i + 1), ground - storey * i, i); return out; }

    /* Теплопотери 0…1 по стенам, окнам и кровле — из тех же ответов, что идут в расчёт */
    var wallLoss = ({ thin: 0.9, normal: 0.5, thick: 0.15 })[a.thickness];
    if (wallLoss === undefined) wallLoss = a.wall ? 0.5 : 0;
    wallLoss = Math.min(1, wallLoss + (({ old: 0.3, y1990: 0.15 })[a.year] || 0));
    var windowLoss = ({ energy: 0.15, double: 0.45, old: 0.95 })[a.windows] || 0;
    var roofLoss = ({ yes: 0.12, partial: 0.55, no: 0.95, unknown: 0.5 })[a.roof] || 0;

    var hatchId = 'thHatch';
    var hatch = ({
      aerated: '<pattern id="' + hatchId + '" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0 0H8M0 0V5M4 2.5V5M0 2.5H8" class="s-hatch-line"/></pattern>',
      brick: '<pattern id="' + hatchId + '" width="6" height="3" patternUnits="userSpaceOnUse"><path d="M0 0H6M0 1.5H6M0 0V1.5M3 1.5V3" class="s-hatch-line"/></pattern>',
      frame: '<pattern id="' + hatchId + '" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4" class="s-hatch-line"/></pattern>',
      timber: '<pattern id="' + hatchId + '" width="6" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H6M0 2H6" class="s-hatch-line"/></pattern>'
    })[a.wall] || '';
    var wallFill = hatch ? 'url(#' + hatchId + ')' : 'none';

    var draft = a.stage === 'design' ? ' s-line--draft' : '';
    part('shell' + a.stage, true,
      '<path class="s-line' + draft + '" d="M' + (left - 12) + ' ' + top + 'L' + mid + ' ' + roofTop + 'L' + (right + 12) + ' ' + top + '"/>' +
      '<path class="s-line' + draft + '" d="M' + left + ' ' + top + 'V' + ground + 'H' + right + 'V' + top + 'H' + left + '"/>' +
      '<path class="s-ground" d="M2 ' + ground + 'H298"/>' +
      '<path class="s-ground s-ground--hatch" d="M' + (left - 6) + ' ' + (ground + 4) + 'H' + (right + 6) + '"/>' +
      (a.stage === 'design' ? '<text class="s-tag" x="' + mid + '" y="' + (top + 12) + '">проект</text>' : ''));
    part('scaffold', a.stage === 'building',
      '<path class="s-scaffold" d="M' + (right + 8) + ' ' + ground + 'V' + (top - 4) + 'M' + (right + 16) + ' ' + ground + 'V' + (top - 4) +
      each(function (y0) { return 'M' + (right + 8) + ' ' + y0 + 'H' + (right + 16); }) + '"/>');
    part('walls' + a.wall + a.thickness + floors + storey + width, !!a.wall,
      (hatch ? '<defs>' + hatch + '</defs>' : '') +
      '<rect class="s-wallband" x="' + left + '" y="' + top + '" width="' + wallT + '" height="' + (ground - top) + '" fill="' + wallFill + '"/>' +
      '<rect class="s-wallband" x="' + (right - wallT) + '" y="' + top + '" width="' + wallT + '" height="' + (ground - top) + '" fill="' + wallFill + '"/>' +
      (facade
        ? '<rect class="s-insul" x="' + (left - facade) + '" y="' + top + '" width="' + facade + '" height="' + (ground - top) + '"/>' +
          '<rect class="s-insul" x="' + right + '" y="' + top + '" width="' + facade + '" height="' + (ground - top) + '"/>'
        : ''));
    part('floors' + floors + storey + width, floors > 1 || storey > 40, each(function (y0, y1, i) {
      if (!i) return '';
      // Двусветное пространство: перекрытие только над половиной этажа
      var end = storey > 40 ? mid : right - wallT;
      return '<path class="s-slab" d="M' + (left + wallT) + ' ' + y1 + 'H' + end + '"/>';
    }));
    part('roof' + a.roof + width + floors + storey, a.roof === 'yes' || a.roof === 'partial',
      '<path class="s-insul-line' + (a.roof === 'partial' ? ' s-insul-line--partial' : '') + '" d="M' + (left + 4) + ' ' + (top - 3) + 'L' + mid + ' ' + (roofTop + 5) + 'L' + (right - 4) + ' ' + (top - 3) + '"/>');
    part('windows' + a.windows + floors + storey + width, !!a.windows, each(function (y0) {
      var h = Math.min(14, storey - 14), y = y0 + 7;
      var mod = a.windows === 'energy' ? ' s-window--energy' : a.windows === 'old' ? ' s-window--old' : '';
      return [left + 14, right - 28].map(function (x) {
        return '<rect class="s-window' + mod + '" x="' + x + '" y="' + y + '" width="14" height="' + h + '" rx="1"/>' +
          (a.windows === 'old' ? '<path class="s-window-cross" d="M' + (x + 7) + ' ' + y + 'V' + (y + h) + 'M' + x + ' ' + (y + h / 2) + 'H' + (x + 14) + '"/>' : '');
      }).join('');
    }));

    /* Потери тепла: стрелки наружу, длина и яркость — по качеству ограждения */
    var arrow = function (x, y, dx, dy, loss) {
      var len = 5 + 15 * loss;
      var x2 = x + dx * len, y2 = y + dy * len;
      return '<g class="s-loss" style="opacity:' + (0.25 + 0.75 * loss).toFixed(2) + '"><path d="M' + x + ' ' + y + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '"/>' +
        '<path d="M' + (x2 - dy * 3 - dx * 3).toFixed(1) + ' ' + (y2 + dx * 3 - dy * 3).toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'L' + (x2 + dy * 3 - dx * 3).toFixed(1) + ' ' + (y2 - dx * 3 - dy * 3).toFixed(1) + '"/></g>';
    };
    var losses = '';
    if (a.wall || a.thickness) losses += arrow(left - facade - 2, ground - storey * floors * 0.35, -1, 0, wallLoss) + arrow(right + facade + 2, ground - storey * floors * 0.65, 1, 0, wallLoss);
    if (a.windows) losses += arrow(left + 2, ground - storey * floors + 14, -0.7, -0.7, windowLoss);
    if (a.roof) losses += arrow(mid - width * 0.22, roofTop + 14, -0.45, -0.9, roofLoss) + arrow(mid + width * 0.22, roofTop + 14, 0.45, -0.9, roofLoss);
    part('loss' + a.thickness + a.year + a.windows + a.roof + width + floors + storey, !!losses, '<g class="s-losses">' + losses + '</g>');

    /* Регион: расчётная температура и снег на скатах в холодном климате */
    part('region' + a.region, !!region,
      '<g class="s-thermo"><rect x="262" y="8" width="32" height="16" rx="8"/><text x="278" y="19">' + region.tOut + '°</text></g>' +
      (region.tOut <= -30 ? '<path class="s-snow" d="M' + (left - 10) + ' ' + (top - 2) + 'L' + mid + ' ' + (roofTop - 2) + 'L' + (right + 10) + ' ' + (top - 2) + '"/>' : ''));

    /* Отопительные контуры */
    var e = a.emitters;
    part('emit-' + e + floors + storey + width, !!e, each(function (y0, y1, i) {
      var floor = e === 'floor' || ((e === 'mixed' || e === 'undecided') && i === 0);
      return floor
        ? '<path class="s-heat" d="M' + (left + wallT + 3) + ' ' + (y1 - 3) + 'H' + (right - wallT - 3) + '"/>'
        : '<rect class="s-radiator" x="' + (left + 12) + '" y="' + (y1 - 9) + '" width="18" height="6" rx="1"/><rect class="s-radiator" x="' + (right - 30) + '" y="' + (y1 - 9) + '" width="18" height="6" rx="1"/>';
    }));

    /* Наружный блок с вентилятором и подача в дом */
    part('unit', true,
      '<g opacity="' + (cfg ? 1 : 0.4) + '"><rect class="s-box s-box--cold" x="' + unitX + '" y="' + (ground - 34) + '" width="46" height="32" rx="3"/>' +
      '<circle class="s-fan-ring" cx="' + (unitX + 16) + '" cy="' + (ground - 18) + '" r="10"/>' +
      '<path class="s-fan" d="M' + (unitX + 16) + ' ' + (ground - 27) + 'V' + (ground - 9) + 'M' + (unitX + 7) + ' ' + (ground - 18) + 'H' + (unitX + 25) + '"/>' +
      '<text class="s-cap" x="' + (unitX + 38) + '" y="' + (ground - 15) + '">' + (cfg ? cfg.power : '·') + '</text>' +
      '<text class="s-cap s-cap--muted" x="' + (unitX + 38) + '" y="' + (ground - 7) + '">' + (cfg ? 'кВт' : '') + '</text>' +
      '<path class="s-pipe-cold" d="M' + (unitX + 46) + ' ' + (ground - 20) + 'H' + (left + 22) + '"/></g>');
    part('buffer', !!cfg,
      '<rect class="s-box" x="' + (left + 22) + '" y="' + (ground - 26) + '" width="20" height="22" rx="2"/>' +
      '<path class="s-pipe-warm" d="M' + (left + 42) + ' ' + (ground - 15) + 'H' + (left + 50) + '"/>');
    /* Бойлер ГВС: высота растёт с числом жильцов, ванна добавляет запас */
    var tankH = Math.min(storey - 6, 14 + (a.people || 3) * 1.6 + (a.bath ? 3 : 0) + ((a.bathrooms || 1) - 1) * 2);
    part('dhw' + a.people + a.bath + a.bathrooms + storey, dhwAsked,
      '<rect class="s-box s-box--warm" x="' + (left + 50) + '" y="' + (ground - 4 - tankH).toFixed(1) + '" width="16" height="' + tankH.toFixed(1) + '" rx="3"/>' +
      (a.bath ? '<path class="s-bath" d="M' + (left + 74) + ' ' + (ground - 9) + 'h18v4a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3z"/>' : ''));
    var boiler = a.existing && a.existing !== 'none';
    part('boiler' + a.existing, boiler,
      '<rect class="s-box s-box--old" x="' + (right - wallT - 20) + '" y="' + (ground - 24) + '" width="14" height="20" rx="2"/>' +
      (a.existing === 'gas' || a.existing === 'diesel' || a.existing === 'stove'
        ? '<path class="s-chimney" d="M' + (right - 22) + ' ' + (top - 10) + 'V' + (top - 22) + '"/><path class="s-smoke" d="M' + (right - 22) + ' ' + (top - 24) + 'c-4 -4 4 -7 0 -11s4 -7 0 -10"/>'
        : ''));
    /* Электрощит: выделенная мощность и фазы */
    var phases = a.phases === 'unknown' ? '?' : a.phases;
    part('power' + a.power + a.phases, !!a.power,
      '<g class="s-panel' + (cfg && cfg.power > 12 && a.phases === 1 ? ' s-panel--warn' : '') + '"><rect x="' + (right + facade + 20) + '" y="' + (ground - 46) + '" width="22" height="28" rx="2"/>' +
      '<path d="M' + (right + facade + 33) + ' ' + (ground - 41) + 'l-4 8h5l-4 8"/>' +
      '<text x="' + (right + facade + 31) + '" y="' + (ground - 8) + '">' + (a.power === 'unknown' ? '15?' : a.power) + ' кВт' + (phases ? ' · ' + phases + 'ф' : '') + '</text></g>');
    part('plans', a.plans && a.plans.length > 0,
      '<g class="s-doc"><path d="M8 8h16l5 5v17H8z"/><path d="M24 8v5h5M12 18h12M12 23h9"/><text x="34" y="22">план · ' + a.plans.length + '</text></g>');

    return '<svg class="scheme scheme--flow" viewBox="0 0 300 200" role="img" aria-label="Схема дома и подобранной системы">' +
      parts.join('') +
      '<text class="s-cap" x="150" y="197">' + (e ? emitterLabel(e) : 'контуры отопления') + '</text>' +
    '</svg>';
  }

  /* ── Шаг 1: дом ────────────────────────────────────────── */
  function rHouse() {
    var a = state.a;
    return head('Расскажите о доме', 'Площадь и стадия определяют, по какому сценарию считать: для стройки можно заложить низкотемпературные контуры, для готового дома работаем с тем, что есть.') +
      group('Отапливаемая площадь', slider('area', 40, 900, 5, a.area, 'м²')) +
      group('Этажей', opts('floors', [
        [1, '1 этаж'], [2, '2 этажа'], [3, '3 этажа и более']
      ], a.floors)) +
      group('Высота потолков', opts('ceiling', [
        [2.7, 'до 3 м'], [3.5, '3–4 м'], [4.5, 'выше 4 м', 'двусветное пространство']
      ], a.ceiling)) +
      group('На каком вы этапе', opts('stage', [
        ['design', 'Проектирую дом', 'можно заложить тёплый пол'],
        ['building', 'Строю', 'стены есть, стяжки нет'],
        ['ready', 'Живу в доме', 'меняю существующее отопление']
      ], a.stage, 2));
  }
  function vHouse() { var a = state.a; return a.area >= 40 && !!a.floors && !!a.ceiling && !!a.stage; }

  /* ── Шаг 2: утепление ──────────────────────────────────── */
  function rEnvelope() {
    var a = state.a;
    var html = head('Из чего построен дом', 'Утепление определяет теплопотери — от них напрямую зависит мощность насоса. Разница между хорошим и слабым контуром на одной площади — двукратная.') +
      group('Материал стен', opts('wall', [
        ['aerated', 'Газобетон', 'или керамоблок'],
        ['brick', 'Кирпич'],
        ['frame', 'Каркас', 'с минватой'],
        ['timber', 'Брус или бревно'],
        ['unknown', 'Не знаю', 'примем среднее']
      ], a.wall)) +
      group('Толщина стен и утепление фасада', opts('thickness', [
        ['thin', 'Тонкие', 'до 300 мм, без фасада'],
        ['normal', 'Стандарт', '375–400 мм'],
        ['thick', 'С запасом', 'стена + утеплитель 50–150 мм'],
        ['unknown', 'Не знаю']
      ], a.thickness));

    if (a.stage === 'ready') {
      html += group('Год постройки', opts('year', [
        ['new', 'После 2015'], ['y2000', '2000–2015'], ['y1990', '1990-е'], ['old', 'До 1990'], ['unknown', 'Не знаю']
      ], a.year));
    }

    html += group('Окна', opts('windows', [
      ['energy', 'Энергосберегающие', 'двухкамерные, i-стекло'],
      ['double', 'Обычные стеклопакеты'],
      ['old', 'Старые деревянные']
    ], a.windows)) +
      group('Утепление кровли и перекрытий', opts('roof', [
        ['yes', 'Утеплено', '200 мм и более'],
        ['partial', 'Частично'],
        ['no', 'Не утеплено'],
        ['unknown', 'Не знаю']
      ], a.roof));

    if (a.wall && a.region) {
      var loss = E.heatLoss(a);
      html += '<p class="q__hint">Расчётные теплопотери: <b class="num">' + loss.q + ' Вт/м²</b> — это класс «' + loss.label + '». Итого ' + fmt(loss.kw) + ' кВт на дом.</p>';
    }
    return html;
  }
  function vEnvelope() {
    var a = state.a;
    var yearOk = a.stage !== 'ready' || !!a.year;
    return !!a.wall && !!a.thickness && !!a.windows && !!a.roof && yearOk;
  }

  /* ── Шаг 3: регион ─────────────────────────────────────── */
  function rRegion() {
    var a = state.a;
    var r = region(a.region);
    var html = head('Где находится дом', 'Мощность считается на расчётную температуру самой холодной пятидневки по СП 131.13330 — не на среднюю зимнюю.') +
      group('Регион', '<select class="q__select" data-field="region">' + E.REGIONS.map(function (x) {
        return '<option value="' + x.id + '"' + (x.id === a.region ? ' selected' : '') + '>' + x.name + '</option>';
      }).join('') + '</select>');

    html += '<div class="preview"><div class="preview__row"><span>Расчётная температура</span><strong>' + E.formatTemp(r.tOut) + '</strong></div>' +
      '<div class="preview__row"><span>Градусо-сутки отопительного периода</span><strong>' + r.hdd + '</strong></div>' +
      '<div class="preview__row"><span>Тариф на электроэнергию</span><strong>' + E.formatDec(r.tariff) + ' ₽/кВт·ч</strong></div></div>';

    if (!r.service) {
      html += '<p class="q__hint q__hint--warn">Монтаж в этом регионе мы не выполняем. Но сделаем удалённый проект и подскажем проверенных монтажников — расчёт всё равно доведём до конца.</p>';
    } else {
      html += '<p class="q__hint">Регион в зоне монтажа. Выезд на аудит — в течение недели.</p>';
    }
    return html;
  }

  /* ── Шаг 4: контуры ────────────────────────────────────── */
  function rLoops() {
    var a = state.a;
    var html = head('Что будет отдавать тепло', 'Тёплый пол работает при 35 °C, радиаторы — при 50–55 °C. Каждые 5 °C подачи — это 10 % эффективности насоса.') +
      group('Отопительные контуры', opts('emitters', [
        ['floor', 'Только тёплый пол', '35 °C, максимальный COP'],
        ['mixed', 'Пол и радиаторы', 'две температурные зоны'],
        ['radiators', 'Только радиаторы', '50–55 °C'],
        ['undecided', 'Ещё не решил', 'посчитаем как смешанную']
      ], a.emitters, 2));

    var existing = a.stage === 'ready'
      ? [['gas', 'Газовый котёл'], ['electric', 'Электрокотёл'], ['diesel', 'Дизельный котёл'], ['stove', 'Печь или камин'], ['none', 'Ничего нет']]
      : [['none', 'Ничего не будет', 'насос — единственный источник'], ['electric', 'Планирую электрокотёл', 'как резерв'], ['gas', 'Будет газовый котёл', 'гибридная схема']];

    html += group(a.stage === 'ready' ? 'Что отапливает дом сейчас' : 'Планируется ли второй источник', opts('existing', existing, a.existing, 2));

    if (a.existing && a.existing !== 'none' && a.existing !== 'stove') {
      html += '<p class="q__hint">Отлично: рабочий котёл станет пиковым источником. Насос можно взять на 25 % меньше — система выйдет дешевле на 200–350 тыс ₽.</p>';
    }
    return html;
  }
  function vLoops() { return !!state.a.emitters && !!state.a.existing; }

  /* ── Шаг 5: горячая вода ───────────────────────────────── */
  function rDhw() {
    var a = state.a;
    return head('Горячая вода', 'Объём бойлера считаем по числу жильцов и точек разбора: насос греет воду медленнее котла, поэтому запас по объёму важнее.') +
      group('Сколько человек живёт постоянно', slider('people', 1, 8, 1, a.people, 'чел.')) +
      group('Санузлов с душем или ванной', opts('bathrooms', [[1, '1'], [2, '2'], [3, '3 и более']], a.bathrooms)) +
      group('Есть ли ванна', opts('bath', [[true, 'Есть', 'нужен запас объёма'], [false, 'Только душевые']], a.bath, 2)) +
      '<p class="q__hint">Подберём бойлер <b class="num">' + volume(a) + ' л</b> послойного нагрева.</p>';
  }

  /* ── Шаг 6: электрика ──────────────────────────────────── */
  function rPower() {
    var a = state.a;
    var html = head('Электричество на участке', 'Это инженерный фильтр. Насос потребляет из сети в 3–4 раза меньше, чем отдаёт тепла, но пиковый доводчик добавляет 6–9 кВт разом.') +
      group('Выделенная мощность', opts('power', [
        [5, '5 кВт'], [10, '10 кВт'], [15, '15 кВт'], [20, '20 кВт'], [30, '30 кВт и более'], ['unknown', 'Не знаю', 'примем 15 кВт']
      ], a.power)) +
      group('Фазы', opts('phases', [[1, 'Одна фаза'], [3, 'Три фазы'], ['unknown', 'Не знаю']], a.phases, 2));

    if (a.wall && a.emitters && a.power) {
      var cfg = E.configure(a);
      if (!cfg.powerOk) {
        html += '<p class="q__hint q__hint--warn">Пиковое потребление системы — около ' + fmt(cfg.peakDraw) + ' кВт при выделенных ' + cfg.declaredPower + ' кВт. Покажем варианты в результате: гибридная схема или увеличение ввода.</p>';
      } else if (cfg.phaseIssue) {
        html += '<p class="q__hint q__hint--warn">Насос ' + cfg.power + ' кВт на одной фазе не запустить — понадобится подключение трёх фаз. Разберём в результате.</p>';
      } else {
        html += '<p class="q__hint">Мощности хватает: пиковое потребление около ' + fmt(cfg.peakDraw) + ' кВт из ' + cfg.declaredPower + ' доступных.</p>';
      }
    }
    return html;
  }
  function vPower() { return !!state.a.power && !!state.a.phases; }

  /* ── Шаг 7: план дома ──────────────────────────────────── */
  function rPlan() {
    var a = state.a;
    return head('План дома — если он есть', 'С планом инженер подготовит расчёт по помещениям до выезда. Это экономит вам одну итерацию и неделю времени.') +
      '<div class="drop" id="drop" tabindex="0" role="button" aria-label="Загрузить план дома">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
        '<b>Перетащите файл или нажмите, чтобы выбрать</b>' +
        '<span>JPG, PNG или PDF · до 3 файлов по 10 МБ</span>' +
      '</div>' +
      '<input type="file" id="planInput" accept="image/*,.pdf" multiple hidden>' +
      (a.plans.length ? '<ul class="files">' + a.plans.map(function (f, i) {
        return '<li><span>' + escapeHtml(f.name) + '</span><small>' + Math.round(f.size / 1024) + ' КБ</small>' +
          '<button type="button" data-act="rmfile" data-i="' + i + '" aria-label="Удалить файл">×</button></li>';
      }).join('') + '</ul>' : '') +
      '<p class="q__hint">Шаг необязательный — можно пропустить, расчёт от этого не изменится.</p>';
  }

  /* ── Шаг 8: контакт ────────────────────────────────────── */
  function rContact() {
    var a = state.a;
    var cfg = E.configure(a);
    var est = E.estimate(cfg);

    return head('Расчёт готов', 'Конфигурацию показываем сразу. Диапазон цены и PDF откроются после контакта — так мы понимаем, кому звонит инженер.') +
      '<div class="preview">' +
        '<div class="preview__row"><span>Тип системы</span><strong>' + cfg.typeLabel + '</strong></div>' +
        '<div class="preview__row"><span>Мощность насоса</span><strong>' + cfg.power + ' кВт</strong></div>' +
        '<div class="preview__row"><span>Бойлер ГВС</span><strong>' + cfg.dhwVolume + ' л</strong></div>' +
        '<div class="preview__row"><span>Стоимость под ключ</span><strong class="preview__blur">' + E.formatShort(est.min) + ' — ' + E.formatShort(est.max) + '</strong></div>' +
        '<div class="preview__lock">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 11V8a3.5 3.5 0 1 1 7 0v3" stroke="currentColor" stroke-width="1.6"/></svg>' +
          'Диапазон, разбор цены и PDF — на следующем экране' +
        '</div>' +
      '</div>' +
      '<div class="q__group">' +
        '<label class="field"><span class="field__label">Как к вам обращаться</span>' +
          '<input type="text" data-field="name" value="' + escapeHtml(a.name) + '" placeholder="Андрей" autocomplete="name"></label>' +
        '<label class="field"><span class="field__label">Телефон или email — на выбор</span>' +
          '<input type="text" data-field="phone" value="' + escapeHtml(a.phone) + '" placeholder="+7 900 000-00-00" autocomplete="tel"></label>' +
        '<label class="field"><span class="field__label">Email для PDF-расчёта — если удобнее письмом</span>' +
          '<input type="email" data-field="email" value="' + escapeHtml(a.email) + '" placeholder="you@mail.ru" autocomplete="email"></label>' +
        '<label class="field"><span class="field__label">Когда удобно поговорить с инженером</span>' +
          '<select class="q__select" data-field="slot">' +
            ['', 'Сегодня, 12:00–15:00', 'Сегодня, 15:00–19:00', 'Завтра, 10:00–13:00', 'Завтра, 15:00–19:00', 'Напишите в мессенджер']
              .map(function (s) { return '<option value="' + s + '"' + (s === a.slot ? ' selected' : '') + '>' + (s || 'Выбрать слот — необязательно') + '</option>'; }).join('') +
          '</select></label>' +
        '<label class="check"><input type="checkbox" data-field="consent"' + (a.consent ? ' checked' : '') + '>' +
          '<span>Согласен на обработку персональных данных. Спам не отправляем: только расчёт и один звонок инженера.</span></label>' +
      '</div>';
  }
  function vContact() {
    var a = state.a;
    return !!a.name.trim() && (a.phone.trim().length >= 6 || /.+@.+\..+/.test(a.email)) && a.consent;
  }

  /* ── Экран результата ──────────────────────────────────── */
  function renderResult() {
    var res = state.result || E.calculate(withFlags(state.a));
    state.result = res;
    var cfg = res.config, est = res.estimate, op = res.operation;

    var html = '';
    html += '<div class="res-card res-demo">' +
      '<h3>Предварительный расчёт готов в демо-режиме</h3>' +
      '<p>Данные обработаны только в браузере: заявка не отправлена, инженер не уведомлён. ' +
      'Результат не заменяет теплотехнический расчёт и выездное обследование.</p>' +
    '</div>';

    /* Блокирующая ветка: мощности сети не хватает */
    if (cfg.blocked || cfg.phaseIssue) {
      html += '<div class="res-card res-alert">' +
        '<h3>Насос «в лоб» не подойдёт — но есть два пути</h3>' +
        '<p>' + (cfg.phaseIssue
          ? 'Насос ' + cfg.power + ' кВт требует трёхфазного подключения, а у вас одна фаза.'
          : 'Теплопотери дома ' + fmt(cfg.loss.kw) + ' кВт, пиковое потребление системы около ' + fmt(cfg.peakDraw) + ' кВт при выделенных ' + cfg.declaredPower + ' кВт.') +
        '</p>' +
        '<div class="res-paths">' +
          '<div class="res-path"><b>Гибридная схема</b><p>Насос меньшей мощности закрывает 80–85 % сезона, пики отдаём котлу или ТЭНу. Дешевле на 250–400 тыс ₽ и работает в существующей сети.</p></div>' +
          '<div class="res-path"><b>Увеличение ввода</b><p>Заявка в сетевую компанию на 15–20 кВт. Стоит от 60 тыс ₽ и занимает 1–3 месяца — но снимает ограничение навсегда.</p></div>' +
        '</div>' +
        '<p class="note" style="margin-top:22px">Расчёт ниже сделан для полноценной схемы — инженер на звонке пересчитает под выбранный путь.</p>' +
      '</div>';
    }

    if (cfg.oversize) {
      html += '<div class="res-card res-alert">' +
        '<h3>Объект требует индивидуального проекта</h3>' +
        '<p>Теплопотери ' + fmt(cfg.loss.kw) + ' кВт выходят за серийный ряд оборудования. ' +
        'Такую нагрузку закрывают каскадом из нескольких блоков, и разброс решений здесь слишком велик, ' +
        'чтобы диапазон ниже считать надёжным — воспринимайте его как порядок величины.</p>' +
        '<div class="res-paths">' +
          '<div class="res-path"><b>Сначала — утепление</b><p>На таких теплопотерях 300–500 тыс ₽ в контур ограждающих конструкций окупаются быстрее, чем те же деньги в мощность насоса.</p></div>' +
          '<div class="res-path"><b>Затем — расчёт по помещениям</b><p>Инженер посчитает каждую комнату и предложит зонирование: часть дома может отапливаться отдельным контуром по другому графику.</p></div>' +
        '</div>' +
      '</div>';
    }

    if (!cfg.region.service) {
      html += '<div class="res-card res-alert">' +
        '<h3>Ваш регион вне зоны монтажа</h3>' +
        '<p>Мы не выезжаем в «' + cfg.region.name + '», но сделаем удалённый проект: расчёт по помещениям, схему котельной, спецификацию и шеф-надзор по видео. Монтаж выполнят проверенные подрядчики — подскажем контакты.</p>' +
      '</div>';
    }

    /* Конфигурация и цена */
    html += '<div class="res-top">' +
      '<div class="res-card">' +
        '<div class="res-card__head"><h3>Предварительное решение для вашего дома</h3>' +
          '<span class="res-card__tag">' + cfg.typeLabel + '</span></div>' +
        '<div class="live__scheme">' + resultScheme(cfg) + '</div>' +
        '<ul class="spec-list">' +
          li('Тепловой насос', cfg.typeLabel + ', ' + cfg.power + ' кВт' + (cfg.cascade ? ', каскад' : ', инвертор')) +
          li('Теплопотери дома', fmt(cfg.loss.kw) + ' кВт при ' + E.formatTemp(cfg.region.tOut)) +
          li('Бойлер ГВС', cfg.dhwVolume + ' л, послойный нагрев') +
          li('Буферная ёмкость', cfg.bufferVolume + ' л') +
          li('Автоматика', 'погодозависимое управление') +
          (cfg.peakHeater ? li('Пиковый доводчик', 'электрический, 6 кВт') : '') +
          (cfg.hybrid ? li('Пиковый источник', 'ваш существующий котёл') : '') +
          li('Расчётный SCOP', fmt(cfg.scop) + ' кВт·ч тепла на 1 кВт·ч из сети') +
        '</ul>' +
        (cfg.reasons.length ? '<p class="note" style="margin-top:20px">' + cfg.reasons.join(' ') + '</p>' : '') +
      '</div>' +

      '<div class="res-card">' +
        '<div class="price-big">' +
          '<span>Стоимость под ключ</span>' +
          '<strong>' + E.formatShort(est.min) + '<br>— ' + E.formatShort(est.max) + '</strong>' +
          '<div class="price-big__op">' +
            '<span>Отопление и горячая вода</span>' +
            '<b>≈ ' + E.formatMoney(op.costMonth) + '/мес</b>' +
            '<p>в отопительный сезон, по тарифу ' + E.formatDec(op.tariff) + ' ₽/кВт·ч. За год — ' + E.formatMoney(op.costYear) + ' и ' + new Intl.NumberFormat('ru-RU').format(op.elYear) + ' кВт·ч из сети.</p>' +
          '</div>' +
          '<p>Точная смета — после теплотехнического аудита. У 9 из 10 клиентов итог остаётся внутри этого диапазона.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* Разбор цены */
    html += '<div class="res-card">' +
      '<div class="res-card__head"><h3>Разбор цены по составляющим</h3>' +
        '<span class="res-card__tag">середина вилки ' + E.formatShort(est.total) + '</span></div>' +
      '<ul class="breakdown">' + est.items.map(function (it) {
        return '<li>' +
          '<span class="breakdown__name">' + it.title + '</span>' +
          '<span class="breakdown__val"><b>' + E.formatShort(it.value) + '</b><small>' + it.share + ' %</small></span>' +
          '<span class="breakdown__note">' + it.note + '</span>' +
          '<span class="breakdown__bar"><i style="width:' + it.share + '%"></i></span>' +
        '</li>';
      }).join('') + '</ul>' +
    '</div>';

    /* Допущения */
    html += '<div class="res-card">' +
      '<h3 style="margin-bottom:18px">Что мы приняли за вас</h3>' +
      '<ul class="assumptions">' + res.assumptions.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      '<p class="note" style="margin-top:20px">Каждое допущение — повод для аудита. Инженер проверит их замерами, и диапазон сузится до конкретной цифры.</p>' +
    '</div>';

    /* Действия */
    html += '<div class="res-card">' +
      '<div class="res-card__head"><h3>' + routeMessage(res.score) + '</h3></div>' +
      '<div class="res-actions">' +
        '<button class="btn btn--primary" data-act="pdf">Скачать PDF-расчёт</button>' +
        '<button class="btn btn--ghost" data-act="share">Сохранить расчёт по ссылке</button>' +
        '<button class="btn btn--ghost" data-act="edit">Изменить вводные</button>' +
        '<p class="res-actions__hint" id="resHint">PDF содержит вводные, схему, диапазон, разбор цены и допущения — можно показать супругу или подрядчику.</p>' +
      '</div>' +
    '</div>';

    els.result.innerHTML = html;
    els.result.hidden = false;
  }

  /* Горизонтальная цепочка оборудования без контура дома: под скатом крыши
     не было места под пиковый доводчик — блок налезал на линию ската, а подпись
     подачи не влезала в габарит гидромодуля. Схема-цепочка ближе к проектной
     документации и не имеет этих ограничений. */
  function resultScheme(cfg) {
    var cold = cfg.type === 'ground';
    var peak = cfg.peakHeater || cfg.hybrid;
    return '<svg class="scheme" viewBox="0 0 440 152" role="img" aria-label="Схема подобранной системы">' +
      (peak
        ? '<rect class="s-box s-box--warm" x="128" y="8" width="84" height="30" rx="4"/>' +
          '<text class="s-cap" x="170" y="27">' + (cfg.hybrid ? 'ваш котёл' : 'доводчик 6 кВт') + '</text>' +
          '<path class="s-pipe-warm" d="M170 38v16"/>'
        : '') +
      '<rect class="s-box s-box--cold" x="4" y="54" width="84" height="44" rx="4"/>' +
      '<text class="s-label" x="46" y="74">' + (cold ? 'геозонды' : 'наружный блок') + '</text>' +
      '<text class="s-cap" x="46" y="88">' + cfg.power + ' кВт</text>' +
      '<path class="s-pipe-cold" d="M88 76h40"/>' +
      '<rect class="s-box" x="128" y="54" width="84" height="44" rx="4"/>' +
      '<text class="s-label" x="170" y="74">гидромодуль</text>' +
      '<text class="s-cap" x="170" y="88">' + supplyTemp(state.a.emitters) + ' °C</text>' +
      '<path class="s-pipe-warm" d="M212 76h16"/>' +
      '<rect class="s-box" x="228" y="54" width="64" height="44" rx="4"/>' +
      '<text class="s-label" x="260" y="74">буфер</text>' +
      '<text class="s-cap" x="260" y="88">' + cfg.bufferVolume + ' л</text>' +
      '<path class="s-pipe-warm" d="M292 76h16"/>' +
      '<rect class="s-box s-box--warm" x="308" y="48" width="68" height="56" rx="4"/>' +
      '<text class="s-label" x="342" y="72">ГВС</text>' +
      '<text class="s-cap" x="342" y="86">' + cfg.dhwVolume + ' л</text>' +
      '<path class="s-pipe-warm" d="M260 98v22"/>' +
      '<g class="s-warm">' +
        '<path d="M128 120h248" stroke-dasharray="3 7"/>' +
        '<path d="M128 128h248" stroke-dasharray="3 7"/>' +
      '</g>' +
      '<text class="s-cap" x="252" y="146">' + emitterLabel(state.a.emitters) + '</text>' +
    '</svg>';
  }

  function routeMessage(score) {
    if (score.grade === 'A') return 'Расчёт выглядит достаточно полным для первичной консультации';
    if (score.grade === 'B') return 'Расчёт готов — инженеру потребуется уточнить несколько вводных';
    return 'Расчёт готов как ориентир; нужна индивидуальная проверка';
  }

  /* ── Обработчики ───────────────────────────────────────── */
  function onMainClick(e) {
    var opt = e.target.closest('[data-opt]');
    if (opt) {
      var field = opt.getAttribute('data-opt');
      state.a[field] = parseVal(opt.getAttribute('data-val'));
      render();
      return;
    }
    var rm = e.target.closest('[data-act=rmfile]');
    if (rm) {
      state.a.plans.splice(Number(rm.getAttribute('data-i')), 1);
      render();
      return;
    }
    if (e.target.closest('#drop')) document.getElementById('planInput').click();
  }

  /* Зона загрузки объявлена role="button" — значит должна отвечать на Enter и пробел */
  function onMainKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!e.target.closest || !e.target.closest('#drop')) return;
    e.preventDefault();
    var input = document.getElementById('planInput');
    if (input) input.click();
  }

  function dropZone(e) {
    return e.target && e.target.closest ? e.target.closest('#drop') : null;
  }

  function onDragOver(e) {
    var zone = dropZone(e);
    if (!zone) return;
    e.preventDefault();
    zone.classList.add('is-over');
  }

  function onDragLeave(e) {
    var zone = dropZone(e);
    if (zone) zone.classList.remove('is-over');
  }

  function onDrop(e) {
    var zone = dropZone(e);
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function onMainInput(e) {
    var t = e.target;
    var field = t.getAttribute('data-field');

    if (t.id === 'planInput') { addFiles(t.files); return; }

    if (t.getAttribute('data-range')) {
      var f = t.getAttribute('data-range');
      state.a[f] = Number(t.value);
      var out = els.main.querySelector('[data-out=' + f + ']');
      if (out) out.value = t.value;
      renderLive();
      renderNav();
      refreshHints();
      persist();
      return;
    }
    if (t.getAttribute('data-out')) {
      var fo = t.getAttribute('data-out');
      var v = Number(t.value);
      if (!isNaN(v)) {
        state.a[fo] = v;
        var range = els.main.querySelector('[data-range=' + fo + ']');
        if (range) range.value = v;
        renderLive(); renderNav(); persist();
      }
      return;
    }
    if (!field) return;

    state.a[field] = t.type === 'checkbox' ? t.checked : t.value;
    if (field === 'region') { render(); return; }
    renderLive(); renderNav(); persist();
  }

  /* Обновление подсказки-расчёта без полной перерисовки шага */
  function refreshHints() {
    var hint = els.main.querySelector('.q__hint');
    if (!hint || STEPS[state.step].id !== 'envelope') return;
    if (state.a.wall && state.a.region) {
      var loss = E.heatLoss(state.a);
      hint.innerHTML = 'Расчётные теплопотери: <b class="num">' + loss.q + ' Вт/м²</b> — это класс «' + loss.label + '». Итого ' + fmt(loss.kw) + ' кВт на дом.';
    }
  }

  function onProgressClick(e) {
    var b = e.target.closest('[data-step]');
    if (!b || b.disabled) return;
    state.step = Number(b.getAttribute('data-step'));
    render();
  }

  function onNavClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if (act === 'next' || act === 'skip') { state.step = Math.min(state.step + 1, STEPS.length - 1); scrollToCalc(); }
    if (act === 'back') { state.step = Math.max(0, state.step - 1); scrollToCalc(); }
    if (act === 'submit') { submit(); return; }
    render();
  }

  function onResultClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'pdf') global.print();
    if (act === 'share') {
      var link = shareLink();
      var hint = document.getElementById('resHint');
      if (global.navigator.clipboard) {
        global.navigator.clipboard.writeText(link).then(function () {
          if (hint) hint.textContent = 'Ссылка скопирована. Откройте её на любом устройстве — расчёт восстановится.';
        });
      }
      global.history.replaceState(null, '', '#calc=' + link.split('#calc=')[1]);
    }
    if (act === 'edit') {
      state.submitted = false;
      state.result = null;
      state.step = 0;
      render();
      scrollToCalc();
    }
  }

  function submit() {
    var a = withFlags(state.a);
    state.result = E.calculate(a);
    state.submitted = true;

    /* Демо: расчёт остаётся в браузере. Production-версия должна явно подтвердить передачу в CRM. */
    render();
    scrollToCalc();
  }

  function withFlags(a) {
    var copy = JSON.parse(JSON.stringify(a));
    copy.plans = a.plans;
    copy.hasUnknowns = ['wall', 'thickness', 'year', 'roof', 'power', 'phases'].some(function (k) {
      return a[k] === 'unknown';
    }) || a.emitters === 'undecided';
    return copy;
  }

  function addFiles(list) {
    Array.prototype.slice.call(list).forEach(function (f) {
      if (state.a.plans.length >= 3) return;
      if (f.size > 10 * 1024 * 1024) return;
      state.a.plans.push(f);
    });
    render();
  }

  function scrollToCalc() {
    var top = document.getElementById('calc').getBoundingClientRect().top + global.pageYOffset - 80;
    global.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* ── Хелперы разметки ──────────────────────────────────── */
  function head(title, why) {
    return '<h3 class="q__title">' + title + '</h3><p class="q__why">' + why + '</p>';
  }
  function group(label, body) {
    return '<div class="q__group"><span class="q__label">' + label + '</span>' + body + '</div>';
  }
  function opts(field, items, current, cols) {
    return '<div class="opts' + (cols === 2 ? ' opts--2' : '') + '">' + items.map(function (it) {
      var val = it[0], title = it[1], sub = it[2];
      var on = String(current) === String(val);
      return '<button type="button" class="opt' + (on ? ' is-on' : '') + (val === 'unknown' ? ' opt--muted' : '') + '" ' +
        'data-opt="' + field + '" data-val="' + val + '" aria-pressed="' + on + '">' +
        '<b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function slider(field, min, max, step, val, unit) {
    /* Ширина по числу разрядов максимума: фиксированные 78px оставляли
       под однозначным ответом длинный «хвост» подчёркивания. */
    var width = (String(max).length + 0.5) + 'ch';
    return '<div class="slider">' +
      '<span class="slider__out"><input type="number" data-out="' + field + '" value="' + val + '" min="' + min + '" max="' + max + '" style="width:' + width + '"><small>' + unit + '</small></span>' +
      '<input type="range" data-range="' + field + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
    '</div>';
  }
  function li(k, v) { return '<li><em>' + k + '</em><b>' + v + '</b></li>'; }

  function parseVal(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'unknown' || isNaN(Number(v)) || v === '') return v;
    return Number(v);
  }
  function stepIndex(id) {
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return i;
    return 0;
  }
  function region(id) {
    for (var i = 0; i < E.REGIONS.length; i++) if (E.REGIONS[i].id === id) return E.REGIONS[i];
    return E.REGIONS[0];
  }
  function volume(a) {
    var v = (a.people || 3) * 55 + (a.bathrooms > 1 ? 60 : 0) + (a.bath ? 40 : 0);
    return v <= 200 ? 200 : v <= 300 ? 300 : v <= 400 ? 400 : 500;
  }
  function emitterLabel(e) {
    return { floor: 'тёплый пол, 35 °C', mixed: 'пол и радиаторы', radiators: 'радиаторы, 52 °C', undecided: 'смешанная схема, 45 °C' }[e] || 'контуры отопления';
  }
  function supplyTemp(e) {
    return { floor: 35, mixed: 45, radiators: 52, undecided: 45 }[e] || 45;
  }
  function fmt(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── Публичный интерфейс для лендинга ──────────────────── */
  var PRESETS = {
    compact:  { area: 100, floors: 1, ceiling: 2.7, wall: 'aerated', thickness: 'thick', windows: 'energy', roof: 'yes', emitters: 'floor', existing: 'none', people: 3, bathrooms: 1, bath: false, power: 15, phases: 3 },
    standard: { area: 165, floors: 2, ceiling: 2.7, wall: 'aerated', thickness: 'normal', windows: 'double', roof: 'yes', emitters: 'mixed', existing: 'none', people: 4, bathrooms: 2, bath: true, power: 15, phases: 3 },
    max:      { area: 290, floors: 2, ceiling: 3.5, wall: 'brick', thickness: 'thick', windows: 'energy', roof: 'yes', emitters: 'mixed', existing: 'none', people: 5, bathrooms: 3, bath: true, power: 20, phases: 3 },
    hybrid:   { area: 185, floors: 2, ceiling: 2.7, wall: 'brick', thickness: 'normal', windows: 'double', roof: 'partial', emitters: 'radiators', existing: 'diesel', people: 4, bathrooms: 2, bath: true, power: 15, phases: 3, stage: 'ready', year: 'y2000' }
  };

  global.Calculator = {
    init: init,
    startWithArea: function (area) {
      if (area) state.a.area = area;
      state.submitted = false; state.result = null; state.step = 0;
      render(); scrollToCalc();
    },
    setStage: function (stage) {
      state.a.stage = stage;
      state.submitted = false; state.result = null; state.step = 0;
      render(); scrollToCalc();
    },
    applyPreset: function (name) {
      var p = PRESETS[name];
      if (!p) return;
      state.a = merge(defaults(), p);
      if (!state.a.stage) state.a.stage = 'building';
      state.a.plans = [];
      state.submitted = false; state.result = null; state.step = 0;
      render();
      var notice = document.createElement('p');
      notice.className = 'q__hint';
      notice.textContent = 'Заполнили вводные по типовому сценарию — поправьте их под свой дом.';
      els.main.appendChild(notice);
      scrollToCalc();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
