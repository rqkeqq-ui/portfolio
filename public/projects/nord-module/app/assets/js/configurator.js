/* NORD MODULE — конфигуратор: состояние, движок ограничений, расчёт цены, интерфейс */

window.NM = window.NM || {};

(function (NM) {
  'use strict';

  var STORAGE_KEY = 'nm.config.v1';
  var ORDER = ['purpose', 'model', 'facade', 'glazing', 'terrace', 'interior', 'bathroom', 'kitchen', 'heating', 'furniture', 'foundation'];

  var state = NM.defaultConfig();
  var listeners = [];
  var stageIndex = 0;
  var viewMode = 'plan';
  var lastChanges = [];

  /* ================= АНАЛИТИКА ================= */

  NM.track = function (event, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, payload || {}));
    if (window.NM_DEBUG) console.log('[track]', event, payload || {});
  };

  /* ================= ДВИЖОК ОГРАНИЧЕНИЙ ================= */

  function findOption(step, id) {
    if (!step || !step.options) return null;
    for (var i = 0; i < step.options.length; i++) if (step.options[i].id === id) return step.options[i];
    return null;
  }
  NM.findOption = findOption;

  /* Доступна ли опция при текущей конфигурации. Причина всегда объясняется словами. */
  function optionState(step, opt, cfg) {
    var model = NM.modelById(cfg.model);

    if (opt.purposes && opt.purposes.indexOf(cfg.purpose) === -1) {
      return {
        available: false,
        reason: opt.unavailableText || 'Не подходит для назначения «' + NM.purposeById(cfg.purpose).title + '»'
      };
    }
    if (opt.models && opt.models.indexOf(cfg.model) === -1) {
      return { available: false, reason: opt.unavailableText || 'Недоступно для ' + model.name, fix: suggestModel(cfg, opt) };
    }
    if (opt.minArea && model.area < opt.minArea) {
      return { available: false, reason: opt.unavailableText || 'Нужна площадь от ' + opt.minArea + ' м²', fix: suggestModel(cfg, opt) };
    }
    return { available: true };
  }
  NM.optionState = optionState;

  /* Наименьшая модель, при которой опция станет доступной */
  function suggestModel(cfg, opt) {
    for (var i = 0; i < NM.MODELS.length; i++) {
      var m = NM.MODELS[i];
      if (m.purposes.indexOf(cfg.purpose) === -1) continue;
      if (opt.minArea && m.area < opt.minArea) continue;
      if (opt.models && opt.models.indexOf(m.id) === -1) continue;
      if (m.id === cfg.model) continue;
      return { model: m.id, label: 'Перейти на ' + m.name };
    }
    return null;
  }

  /* После смены назначения или модели совместимые выборы сохраняются,
     несовместимые заменяются — и мы прямо перечисляем, что изменилось. */
  function reconcile(cfg) {
    var changes = [];

    var model = NM.modelById(cfg.model);
    if (model.purposes.indexOf(cfg.purpose) === -1) {
      var replacement = null;
      for (var i = 0; i < NM.MODELS.length; i++) {
        if (NM.MODELS[i].purposes.indexOf(cfg.purpose) !== -1) { replacement = NM.MODELS[i]; break; }
      }
      if (replacement) {
        changes.push(model.name + ' не подходит для назначения «' + NM.purposeById(cfg.purpose).title + '» — выбрана ' + replacement.name);
        cfg.model = replacement.id;
      }
    }

    NM.STEPS.forEach(function (step) {
      if (step.type === 'delivery' || step.id === 'purpose' || step.id === 'model') return;
      var current = findOption(step, cfg[step.id]);
      if (current && optionState(step, current, cfg).available) return;

      var fallback = null;
      for (var j = 0; j < step.options.length; j++) {
        if (optionState(step, step.options[j], cfg).available) { fallback = step.options[j]; break; }
      }
      if (fallback && current) {
        changes.push(step.title + ': «' + current.title + '» недоступно — заменено на «' + fallback.title + '»');
        cfg[step.id] = fallback.id;
      }
    });

    return changes;
  }

  function advisories(cfg) {
    return NM.ADVISORIES.filter(function (a) { return a.when(cfg); });
  }
  NM.advisories = advisories;

  /* ================= РАСЧЁТ ================= */

  function deliveryPrice(cfg) {
    var over = Math.max(0, (cfg.distance || 0) - NM.DELIVERY.freeKm);
    return over * NM.DELIVERY.perKm + (cfg.crane ? NM.DELIVERY.crane : 0);
  }

  function calc(cfg) {
    cfg = cfg || state;
    var model = NM.modelById(cfg.model);
    var groups = [];

    var base = {
      title: 'Базовая комплектация',
      items: [{
        title: model.name + ' «' + model.sub + '», ' + model.area + ' м²',
        note: model.len.toFixed(1).replace('.', ',') + ' × ' + model.depth.toFixed(1).replace('.', ',') + ' м · каркас, утепление 200 мм, фасад, окна, электрика, отделка, гарантия 5 лет',
        price: model.base
      }],
      total: model.base
    };
    groups.push(base);

    NM.STAGES.forEach(function (stage) {
      var group = { title: stage.title, items: [], total: 0 };
      NM.STEPS.forEach(function (step) {
        if (step.stage !== stage.id) return;
        if (step.id === 'purpose' || step.id === 'model' || step.type === 'delivery') return;
        var opt = findOption(step, cfg[step.id]);
        if (!opt) return;
        group.items.push({ title: step.title + ' · ' + opt.title, price: opt.price });
        group.total += opt.price;
      });
      if (group.items.length) groups.push(group);
    });

    var mandatory = { title: 'Обязательные позиции', items: [], total: 0 };
    NM.MANDATORY.forEach(function (m) {
      if (!m.when(cfg)) return;
      mandatory.items.push({ title: m.title, note: m.note, price: m.price, mandatory: true });
      mandatory.total += m.price;
    });
    if (mandatory.items.length) groups.push(mandatory);

    var dp = deliveryPrice(cfg);
    var dist = cfg.distance || 0;
    var delivery = {
      title: 'Доставка и монтаж',
      items: [{
        title: dist <= NM.DELIVERY.freeKm
          ? 'Доставка ' + dist + ' км и монтаж'
          : 'Доставка ' + dist + ' км (' + NM.DELIVERY.freeKm + ' км включено, ' + (dist - NM.DELIVERY.freeKm) + ' × ' + NM.DELIVERY.perKm + ' ₽) и монтаж',
        price: dp - (cfg.crane ? NM.DELIVERY.crane : 0)
      }],
      total: dp
    };
    if (cfg.crane) delivery.items.push({ title: 'Автокран на монтаже', price: NM.DELIVERY.crane });
    groups.push(delivery);

    var total = groups.reduce(function (sum, g) { return sum + g.total; }, 0);
    return { groups: groups, total: total, model: model, delivery: dp };
  }
  NM.calc = calc;

  /* ================= СОСТОЯНИЕ ================= */

  function notify() {
    listeners.forEach(function (fn) { fn(state); });
    save();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, encode(state)); } catch (e) { /* приватный режим */ }
  }

  function encode(cfg) {
    var parts = ORDER.map(function (k) { return cfg[k]; });
    parts.push(cfg.distance || 0);
    parts.push(cfg.crane ? 1 : 0);
    return parts.join('.');
  }

  function decode(str) {
    if (!str) return null;
    var parts = String(str).split('.');
    if (parts.length < ORDER.length) return null;
    var cfg = NM.defaultConfig();
    ORDER.forEach(function (k, i) {
      var step = NM.stepById(k);
      if (k === 'purpose') { if (NM.purposeById(parts[i]).id === parts[i]) cfg[k] = parts[i]; return; }
      if (k === 'model') { if (NM.modelById(parts[i]).id === parts[i]) cfg[k] = parts[i]; return; }
      if (step && findOption(step, parts[i])) cfg[k] = parts[i];
    });
    var d = parseInt(parts[ORDER.length], 10);
    cfg.distance = isNaN(d) ? 40 : Math.max(0, Math.min(900, d));
    cfg.crane = parts[ORDER.length + 1] === '1';
    return cfg;
  }

  /* Номер конфигурации для разговора с менеджером — детерминированно выводится из самой конфигурации */
  function configCode(cfg) {
    var s = encode(cfg), h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return 'NM-' + Math.abs(h).toString(36).toUpperCase().slice(0, 5).padStart(5, '0');
  }

  function shareUrl(cfg) {
    var base = location.href.split('#')[0];
    return base + '#c=' + encode(cfg);
  }

  NM.conf = {
    get: function () { return state; },
    code: function () { return configCode(state); },
    url: function () { return shareUrl(state); },
    encode: encode,
    decode: decode,
    subscribe: function (fn) { listeners.push(fn); fn(state); },

    set: function (stepId, value) {
      if (state[stepId] === value) return;
      state[stepId] = value;
      lastChanges = (stepId === 'purpose' || stepId === 'model') ? reconcile(state) : [];
      NM.track('config_change', { step: stepId, value: value, total: calc(state).total });
      notify();
    },

    patch: function (patch) {
      Object.assign(state, patch);
      lastChanges = reconcile(state);
      notify();
    },

    replace: function (cfg) {
      state = Object.assign(NM.defaultConfig(), cfg);
      lastChanges = reconcile(state);
      notify();
    },

    changes: function () { return lastChanges; },
    clearChanges: function () { lastChanges = []; },

    restore: function () {
      var fromHash = /[#&]c=([^&]+)/.exec(location.hash);
      var decoded = fromHash ? decode(decodeURIComponent(fromHash[1])) : null;
      if (!decoded) {
        try { decoded = decode(localStorage.getItem(STORAGE_KEY)); } catch (e) { decoded = null; }
        if (decoded) NM.restoredFromStorage = true;
      } else {
        NM.restoredFromLink = true;
      }
      if (decoded) { state = decoded; reconcile(state); }
      return !!decoded;
    },

    stage: function () { return stageIndex; },
    goStage: function (i) {
      stageIndex = Math.max(0, Math.min(NM.STAGES.length, i));
      viewMode = (stageIndex === 0 || stageIndex === 2) ? 'plan' : 'exterior';
      NM.track('config_stage', { stage: stageIndex });
      notify();
    },
    view: function () { return viewMode; },
    setView: function (v) { viewMode = v; notify(); }
  };

  /* ================= ПРОВЕРКА ПРОЕЗДА ================= */

  NM.accessChecker = function (root, opts) {
    opts = opts || {};
    var answers = {};

    function verdict() {
      var keys = Object.keys(answers);
      if (keys.length < NM.ACCESS_QUESTIONS.length) return null;
      var ranks = { ok: 0, check: 1, crane: 2 };
      var worst = 'ok';
      keys.forEach(function (k) { if (ranks[answers[k]] > ranks[worst]) worst = answers[k]; });
      return worst;
    }

    function render() {
      var v = verdict();
      var html = NM.ACCESS_QUESTIONS.map(function (q) {
        return '<div class="access__q">' +
          '<div class="access__qtitle">' + q.title + '</div>' +
          '<div class="access__qhint">' + q.hint + '</div>' +
          '<div class="access__opts">' + q.options.map(function (o) {
            var on = answers[q.id] === o.verdict && answers['_' + q.id] === o.id;
            return '<button type="button" class="access__opt' + (on ? ' is-on' : '') +
              '" data-q="' + q.id + '" data-o="' + o.id + '" data-v="' + o.verdict + '">' + o.title + '</button>';
          }).join('') + '</div></div>';
      }).join('');

      if (v) {
        var res = NM.ACCESS_VERDICTS[v];
        html += '<div class="access__verdict access__verdict--' + res.tone + '">' +
          '<div class="access__vtitle">' + res.title + '</div>' +
          '<p class="access__vtext">' + res.text + '</p>' +
          (opts.showCta !== false ? '<button type="button" class="btn btn--primary" data-act="open-cfg">Собрать модуль с этой доставкой</button>' : '') +
          '</div>';
      } else {
        html += '<div class="access__verdict access__verdict--idle">Ответьте на три вопроса — сразу скажем, проедет ли манипулятор.</div>';
      }
      root.innerHTML = html;
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.access__opt');
      if (btn) {
        answers[btn.dataset.q] = btn.dataset.v;
        answers['_' + btn.dataset.q] = btn.dataset.o;
        render();
        if (opts.onChange) opts.onChange({ width: answers._width, height: answers._height, reach: answers._reach });
        var v = verdict();
        if (v) {
          NM.track('access_check', { verdict: v });
          if (opts.onVerdict) opts.onVerdict(v);
        }
        return;
      }
      if (e.target.closest('[data-act="open-cfg"]')) {
        var v2 = verdict();
        if (v2 === 'crane') NM.conf.patch({ crane: true });
        NM.openConfigurator('access-check');
      }
    });

    render();
  };

  /* ================= ИНТЕРФЕЙС КОНФИГУРАТОРА ================= */

  var root, visualEl, panelEl, totalEl, stagesEl, opened = false;

  NM.openConfigurator = function (source) {
    if (!root) buildShell();
    opened = true;
    root.classList.add('is-open');
    document.body.classList.add('nm-locked');
    NM.track('config_start', { source: source || 'unknown', total: calc(state).total });
    renderAll();
    root.querySelector('.cfg__panel').scrollTop = 0;
  };

  NM.closeConfigurator = function () {
    if (!root) return;
    opened = false;
    root.classList.remove('is-open');
    document.body.classList.remove('nm-locked');
  };

  function buildShell() {
    root = document.createElement('div');
    root.className = 'cfg';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Конфигуратор модуля');
    root.innerHTML =
      '<header class="cfg__bar">' +
        '<div class="cfg__brand">NORD<span>MODULE</span></div>' +
        '<nav class="cfg__stages" aria-label="Этапы"></nav>' +
        '<button type="button" class="cfg__close" data-act="close" aria-label="Закрыть конфигуратор">' +
          '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="cfg__body">' +
        '<section class="cfg__visual"></section>' +
        '<section class="cfg__panel" tabindex="-1"></section>' +
      '</div>' +
      '<footer class="cfg__total"></footer>';
    document.body.appendChild(root);

    visualEl = root.querySelector('.cfg__visual');
    panelEl = root.querySelector('.cfg__panel');
    totalEl = root.querySelector('.cfg__total');
    stagesEl = root.querySelector('.cfg__stages');

    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opened) NM.closeConfigurator();
    });
    NM.conf.subscribe(function () { if (opened) renderAll(); });
  }

  function onClick(e) {
    var t = e.target;

    if (t.closest('[data-act="close"]')) return NM.closeConfigurator();

    var opt = t.closest('[data-step][data-value]');
    if (opt && !opt.classList.contains('is-blocked')) {
      NM.conf.set(opt.dataset.step, opt.dataset.value);
      return;
    }

    var fixModel = t.closest('[data-fix-model]');
    if (fixModel) { NM.conf.set('model', fixModel.dataset.fixModel); return; }

    var advFix = t.closest('[data-adv-step]');
    if (advFix) { NM.conf.set(advFix.dataset.advStep, advFix.dataset.advValue); return; }

    var stageBtn = t.closest('[data-stage]');
    if (stageBtn) { NM.conf.goStage(parseInt(stageBtn.dataset.stage, 10)); scrollPanelTop(); return; }

    if (t.closest('[data-act="next"]')) { NM.conf.goStage(stageIndex + 1); scrollPanelTop(); return; }
    if (t.closest('[data-act="prev"]')) { NM.conf.goStage(stageIndex - 1); scrollPanelTop(); return; }

    var view = t.closest('[data-view]');
    if (view) { NM.conf.setView(view.dataset.view); return; }

    if (t.closest('[data-act="toggle-spec"]')) {
      root.querySelector('.cfg__spec').classList.toggle('is-open');
      return;
    }

    if (t.closest('[data-act="copy-link"]')) {
      var url = shareUrl(state);
      var done = function () {
        var b = root.querySelector('[data-act="copy-link"]');
        if (b) { b.classList.add('is-done'); b.textContent = 'Ссылка скопирована'; setTimeout(function () { b.classList.remove('is-done'); b.textContent = 'Скопировать ссылку'; }, 2200); }
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
      NM.track('config_share', { method: 'copy' });
      return;
    }

    if (t.closest('[data-act="print"]')) { NM.track('config_pdf', {}); window.print(); return; }
    if (t.closest('[data-act="restart"]')) { NM.conf.replace(NM.defaultConfig()); NM.conf.goStage(0); return; }
    if (t.closest('[data-act="crane"]')) { NM.conf.patch({ crane: !state.crane }); return; }
  }

  function onInput(e) {
    if (e.target.name === 'distance') {
      var v = Math.max(0, Math.min(900, parseInt(e.target.value, 10) || 0));
      NM.conf.patch({ distance: v });
    }
  }

  function onSubmit(e) {
    if (!e.target.matches('.cfg__lead')) return;
    e.preventDefault();
    var form = e.target;
    var data = { code: configCode(state), total: calc(state).total };
    NM.track('config_demo_complete', data);
    form.outerHTML =
      '<div class="cfg__sent">' +
        '<div class="cfg__sent-mark">✓</div>' +
        '<h3>Демо-конфигурация ' + data.code + ' готова</h3>' +
        '<p>Контакты не запрашивались, менеджеру ничего не отправлено. Конфигурация полностью закодирована в ссылке.</p>' +
        '<p class="cfg__sent-note">Скопируйте ссылку выше, чтобы сохранить сборку или обсудить её с тем, с кем принимаете решение.</p>' +
      '</div>';
  }

  function scrollPanelTop() {
    if (panelEl) panelEl.scrollTop = 0;
  }

  /* ---------- рендер ---------- */

  function renderAll() {
    renderStages();
    renderVisual();
    renderPanel();
    renderTotal();
  }

  function renderStages() {
    var items = NM.STAGES.map(function (s, i) {
      var cls = 'cfg__stage' + (i === stageIndex ? ' is-active' : '') + (i < stageIndex ? ' is-done' : '');
      return '<button type="button" class="' + cls + '" data-stage="' + i + '">' +
        '<span class="cfg__stage-num">' + (i + 1) + '</span><span class="cfg__stage-title">' + s.title + '</span></button>';
    });
    items.push('<button type="button" class="cfg__stage' + (stageIndex === NM.STAGES.length ? ' is-active' : '') + '" data-stage="' + NM.STAGES.length + '">' +
      '<span class="cfg__stage-num">✓</span><span class="cfg__stage-title">Готово</span></button>');
    stagesEl.innerHTML = items.join('');
  }

  function renderVisual() {
    var model = NM.modelById(state.model);
    var terr = NM.svg.TERRACES[state.terrace];
    var notes = {
      exterior: 'Фасад перестраивается от каждой опции: модель, обшивка, остекление, терраса, свет интерьера и фундамент. Масштаб 1:50 — человек ростом 1,8 м.',
      plan: NM.svg.planCaption(state) + '. Масштаб единый для всех моделей — переключайте и сравнивайте.',
      photo: 'Фото — реальный модуль такого назначения для ощущения материала и света. Ваша сборка — на чертежах.'
    };
    var tab = function (id, label) {
      return '<button type="button" class="cfg__viewtab' + (viewMode === id ? ' is-on' : '') + '" data-view="' + id + '">' + label + '</button>';
    };

    visualEl.innerHTML =
      '<div class="cfg__viewtabs">' + tab('exterior', 'Фасад') + tab('plan', 'Планировка') + tab('photo', 'Фото') + '</div>' +
      '<div class="cfg__canvas' + (viewMode === 'photo' ? '' : ' cfg__canvas--plan') + '">' + (viewMode === 'photo' ? NM.photo('purpose-' + state.purpose) : '') + '</div>' +
      '<div class="cfg__facts">' +
        fact(model.area + ' м²', 'площадь модуля') +
        fact(model.len.toFixed(1).replace('.', ',') + ' × ' + model.depth.toFixed(1).replace('.', ',') + ' м', 'габарит') +
        fact(terr ? terr.label : '—', 'терраса') +
        fact(model.capacity, 'вместимость') +
      '</div>' +
      '<p class="cfg__scale-note">' + (notes[viewMode] || notes.exterior) + '</p>';

    var canvas = visualEl.querySelector('.cfg__canvas');
    if (viewMode === 'plan') NM.svg.renderPlanInto(canvas, state, {});
    else if (viewMode !== 'photo') NM.svg.renderInto(canvas, function (o) { return NM.svg.facade(state, o); });
  }

  function fact(value, label) {
    return '<div class="cfg__fact"><b>' + value + '</b><span>' + label + '</span></div>';
  }

  function renderPanel() {
    if (stageIndex === NM.STAGES.length) { panelEl.innerHTML = renderResult(); return; }

    var stage = NM.STAGES[stageIndex];
    var html = [];

    html.push('<div class="cfg__head">' +
      '<div class="cfg__eyebrow">Этап ' + (stageIndex + 1) + ' из ' + NM.STAGES.length + '</div>' +
      '<h2 class="cfg__title">' + stage.title + '</h2></div>');

    var changes = NM.conf.changes();
    if (changes.length) {
      html.push('<div class="cfg__changes"><b>Часть выбора пришлось изменить:</b><ul>' +
        changes.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>');
    }

    NM.STEPS.forEach(function (step) {
      if (step.stage !== stage.id) return;
      html.push(renderStep(step));
    });

    advisories(state).forEach(function (a) {
      if (NM.STEPS.filter(function (s) { return s.stage === stage.id; })
        .every(function (s) { return s.id !== a.fix.step; })) return;
      html.push(renderAdvisory(a));
    });

    html.push('<div class="cfg__nav">' +
      (stageIndex > 0 ? '<button type="button" class="btn btn--ghost" data-act="prev">Назад</button>' : '<span></span>') +
      '<button type="button" class="btn btn--primary" data-act="next">' +
      (stageIndex === NM.STAGES.length - 1 ? 'Посмотреть спецификацию' : 'Далее: ' + NM.STAGES[stageIndex + 1].title) +
      '</button></div>');

    panelEl.innerHTML = html.join('');
    NM.conf.clearChanges();

    var access = panelEl.querySelector('[data-access]');
    if (access) NM.accessChecker(access, { showCta: false, onVerdict: function (v) { if (v === 'crane' && !state.crane) NM.conf.patch({ crane: true }); } });
  }

  function renderAdvisory(a) {
    return '<div class="cfg__advisory">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l9 17H3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 10v4.5M12 17.2v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '<div><p>' + a.text + '</p>' +
      '<button type="button" class="cfg__advisory-fix" data-adv-step="' + a.fix.step + '" data-adv-value="' + a.fix.value + '">' + a.fix.label + '</button>' +
      '</div></div>';
  }

  function renderStep(step) {
    if (step.type === 'delivery') return renderDelivery(step);

    var cls = 'cfg__opts cfg__opts--' + step.type;
    var options = step.options.map(function (opt) {
      var st = optionState(step, opt, state);
      var selected = state[step.id] === opt.id;
      var priceLabel = opt.hidePrice ? '' :
        (opt.absolute ? NM.price(opt.price) : (opt.price === 0 ? 'в базе' : NM.priceDelta(opt.price)));

      var body =
        (step.type === 'swatch' ? '<span class="cfg__sw sw--' + opt.swatch + '" aria-hidden="true"></span>' : '') +
        '<span class="cfg__opt-main">' +
          '<span class="cfg__opt-title">' + opt.title + '</span>' +
          '<span class="cfg__opt-desc">' + opt.desc + '</span>' +
        '</span>' +
        (priceLabel ? '<span class="cfg__opt-price' + (opt.price < 0 ? ' is-minus' : '') + '">' + priceLabel + '</span>' : '');

      if (!st.available) {
        return '<div class="cfg__opt is-blocked">' + body +
          '<span class="cfg__opt-block">' + st.reason +
          (st.fix ? ' <button type="button" class="cfg__opt-fix" data-fix-model="' + st.fix.model + '">' + st.fix.label + '</button>' : '') +
          '</span></div>';
      }

      return '<button type="button" class="cfg__opt' + (selected ? ' is-selected' : '') + '" data-step="' + step.id + '" data-value="' + opt.id + '">' +
        body + '<span class="cfg__opt-check" aria-hidden="true"></span></button>';
    }).join('');

    return '<fieldset class="cfg__step">' +
      '<legend class="cfg__q">' + step.question + '</legend>' +
      '<p class="cfg__hint">' + step.hint + '</p>' +
      '<div class="' + cls + '">' + options + '</div>' +
      '</fieldset>';
  }

  function renderDelivery(step) {
    var dp = deliveryPrice(state);
    return '<fieldset class="cfg__step">' +
      '<legend class="cfg__q">' + step.question + '</legend>' +
      '<p class="cfg__hint">' + step.hint + ' Дальше — ' + NM.DELIVERY.perKm + ' ₽ за километр. Считаем от точки «' + NM.DELIVERY.origin + '».</p>' +
      '<div class="cfg__distance">' +
        '<label class="cfg__dist-label" for="nm-dist">Расстояние до участка</label>' +
        '<div class="cfg__dist-row">' +
          '<input id="nm-dist" name="distance" type="range" min="0" max="600" step="5" value="' + (state.distance || 0) + '">' +
          '<output class="cfg__dist-out">' + (state.distance || 0) + ' км</output>' +
        '</div>' +
        '<div class="cfg__dist-price">Доставка и монтаж: <b>' + (dp === 0 ? 'входит в цену' : NM.price(dp)) + '</b></div>' +
      '</div>' +
      '<div class="cfg__access"><h4 class="cfg__access-title">Проверка проезда</h4>' +
      '<div data-access></div>' +
      '<label class="cfg__crane"><input type="checkbox" ' + (state.crane ? 'checked' : '') + ' data-act="crane"> ' +
      'Нужен автокран (+ ' + NM.price(NM.DELIVERY.crane) + ')</label></div>' +
      '</fieldset>';
  }

  function renderTotal() {
    var res = calc(state);
    var isResult = stageIndex === NM.STAGES.length;
    totalEl.innerHTML =
      '<div class="cfg__spec">' + specTable(res) + '</div>' +
      '<div class="cfg__total-row">' +
        '<button type="button" class="cfg__total-toggle" data-act="toggle-spec">' +
          '<span class="cfg__total-label">Итого под ключ</span>' +
          '<span class="cfg__total-sum" data-total>' + NM.price(res.total) + '</span>' +
          '<span class="cfg__total-hint">спецификация ▾</span>' +
        '</button>' +
        (isResult ? '' : '<button type="button" class="btn btn--primary" data-act="next">' +
          (stageIndex === NM.STAGES.length - 1 ? 'К спецификации' : 'Далее') + '</button>') +
      '</div>';
  }

  function specTable(res) {
    return '<div class="spec">' +
      res.groups.map(function (g) {
        return '<div class="spec__group"><div class="spec__gtitle">' + g.title + '</div>' +
          g.items.map(function (it) {
            return '<div class="spec__row' + (it.mandatory ? ' is-mandatory' : '') + '">' +
              '<span class="spec__t">' + it.title + (it.note ? '<em>' + it.note + '</em>' : '') + '</span>' +
              '<span class="spec__p">' + (it.price === 0 ? 'включено' : NM.price(it.price)) + '</span></div>';
          }).join('') + '</div>';
      }).join('') +
      '<div class="spec__total"><span>Итого под ключ</span><b>' + NM.price(res.total) + '</b></div>' +
      '<p class="spec__note">Цена окончательная: включает модуль в выбранной комплектации, основание, доставку и монтаж. ' +
      'Мы не добавляем позиции после подписания договора.</p>' +
      '</div>';
  }

  function renderResult() {
    var res = calc(state);
    var code = configCode(state);
    var url = shareUrl(state);
    var purpose = NM.purposeById(state.purpose);

    return '<div class="cfg__result">' +
      '<div class="cfg__head"><div class="cfg__eyebrow">Конфигурация ' + code + '</div>' +
      '<h2 class="cfg__title">' + res.model.name + ' «' + res.model.sub + '» · ' + purpose.title + '</h2></div>' +

      '<div class="cfg__result-price"><span>Итого под ключ</span><b>' + NM.price(res.total) + '</b>' +
      '<em>с доставкой ' + (state.distance || 0) + ' км и монтажом</em></div>' +

      '<div class="cfg__share">' +
        '<div class="cfg__share-title">Ссылка на конфигурацию</div>' +
        '<div class="cfg__share-url">' + url.replace(/^https?:\/\//, '') + '</div>' +
        '<div class="cfg__share-actions">' +
          '<button type="button" class="btn btn--ghost" data-act="copy-link">Скопировать ссылку</button>' +
          '<a class="btn btn--ghost" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Собрал модуль NORD ' + code) + '" target="_blank" rel="noopener">Отправить в Telegram</a>' +
          '<button type="button" class="btn btn--ghost" data-act="print">Скачать спецификацию</button>' +
        '</div>' +
        '<p class="cfg__share-note">Ссылка открывает ровно эту сборку и остаётся рабочей. Отправьте её тому, с кем принимаете решение — спорить по ссылке удобнее, чем по скриншотам.</p>' +
      '</div>' +

      specTable(res) +

      '<form class="cfg__lead" novalidate>' +
        '<h3>Завершить демо-сценарий</h3>' +
        '<p>Проверим финальный экран без сбора телефона и ложного обещания звонка менеджера.</p>' +
        '<button type="submit" class="btn btn--primary btn--wide">Показать итог конфигурации ' + code + '</button>' +
        '<p class="cfg__lead-note">Для production здесь понадобятся CRM, согласие на обработку данных и подтверждённые сроки ответа.</p>' +
      '</form>' +

      '<div class="cfg__nav">' +
        '<button type="button" class="btn btn--ghost" data-act="prev">Вернуться к настройкам</button>' +
        '<button type="button" class="btn btn--ghost" data-act="restart">Собрать заново</button>' +
      '</div>' +
      '</div>';
  }

  /* ================= ВСТРОЕННОЕ ПРЕВЬЮ НА ЛЕНДИНГЕ ================= */

  NM.mountPreview = function (el) {
    function render() {
      var res = calc(state);
      var model = res.model;

      var purposes = NM.PURPOSES.map(function (p) {
        return '<button type="button" class="chip' + (state.purpose === p.id ? ' is-on' : '') + '" data-step="purpose" data-value="' + p.id + '">' + p.title + '</button>';
      }).join('');

      var models = NM.MODELS.map(function (m) {
        var ok = m.purposes.indexOf(state.purpose) !== -1;
        return '<button type="button" class="chip' + (state.model === m.id ? ' is-on' : '') + (ok ? '' : ' is-off') + '" ' +
          (ok ? 'data-step="model" data-value="' + m.id + '"' : 'disabled title="Не подходит для этого назначения"') + '>' +
          m.name + ' <em>' + m.area + ' м²</em></button>';
      }).join('');

      el.innerHTML =
        '<div class="preview__visual preview__visual--drawing"></div>' +
        '<div class="preview__panel">' +
          '<div class="preview__group"><span class="preview__label">Назначение</span><div class="chips">' + purposes + '</div></div>' +
          '<div class="preview__group"><span class="preview__label">Модель</span><div class="chips">' + models + '</div></div>' +
          '<div class="preview__price"><span>Ориентир по этой сборке</span><b>' + NM.price(res.total) + '</b>' +
          '<em>' + model.about + '</em></div>' +
          '<button type="button" class="btn btn--primary btn--wide" data-act="open">Открыть конфигуратор — ещё 10 шагов</button>' +
          '<p class="preview__note">Дальше: фасад, остекление, терраса, интерьер, санузел, кухня, отопление, мебель, основание и доставка. Цена пересчитывается на каждом шаге.</p>' +
        '</div>';
      NM.svg.renderInto(el.querySelector('.preview__visual'), function (o) { return NM.svg.facade(state, o); });
    }

    el.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-step][data-value]');
      if (opt) { NM.conf.set(opt.dataset.step, opt.dataset.value); return; }
      if (e.target.closest('[data-act="open"]')) NM.openConfigurator('preview');
    });

    NM.conf.subscribe(render);
  };

})(window.NM);
