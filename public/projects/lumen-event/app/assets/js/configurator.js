/* LUMEN EVENT — конструктор зон: состояние, расчёт сметы, рендер.
   Зависит от data.js. Экспортирует LUMEN.cfg. */

(function (NS) {
  'use strict';

  var STORAGE_KEY = 'lumen.config.v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var money = new Intl.NumberFormat('ru-RU');
  var fmt = function (n) { return money.format(Math.round(n / 1000) * 1000); };
  var fmtRange = function (r) {
    return r[0] === r[1] ? fmt(r[0]) + ' ₽' : fmt(r[0]) + ' – ' + fmt(r[1]) + ' ₽';
  };

  /* ---------- Состояние ---------- */

  var state = {
    mood: 'classic',
    moodSecond: null,
    date: '',
    guests: 's',
    budget: 250000,
    zones: {}
  };

  NS.ZONES.forEach(function (z) { state.zones[z.id] = { on: false, tier: z.tiers[0].id }; });

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return false;
      ['mood', 'moodSecond', 'date', 'guests', 'budget'].forEach(function (k) {
        if (saved[k] !== undefined && saved[k] !== null) state[k] = saved[k];
      });
      NS.ZONES.forEach(function (z) {
        var s = saved.zones && saved.zones[z.id];
        if (!s) return;
        var valid = z.tiers.some(function (t) { return t.id === s.tier; });
        state.zones[z.id] = { on: !!s.on, tier: valid ? s.tier : z.tiers[0].id };
      });
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Расчёт ---------- */

  function guestK() {
    var t = NS.GUEST_TIERS.filter(function (g) { return g.id === state.guests; })[0];
    return t ? t.k : 1;
  }

  function isWinterDate() {
    if (!state.date) return false;
    var d = new Date(state.date + 'T12:00:00');
    if (isNaN(d)) return false;
    return NS.WINTER_MONTHS.indexOf(d.getMonth()) !== -1;
  }

  function zoneById(id) {
    return NS.ZONES.filter(function (z) { return z.id === id; })[0];
  }

  function tierOf(zone) {
    var st = state.zones[zone.id];
    return zone.tiers.filter(function (t) { return t.id === st.tier; })[0] || zone.tiers[0];
  }

  function zonePrice(zone) {
    var tier = tierOf(zone);
    var k = guestK() * (zone.outdoor && isWinterDate() ? NS.WINTER_K : 1);
    return [tier.min * k, tier.max * k];
  }

  function activeZones() {
    return NS.ZONES.filter(function (z) { return state.zones[z.id].on; });
  }

  /* Полная смета: строки зон + сервисные строки. */
  function estimate() {
    var zones = activeZones();
    var lines = [];
    var sum = [0, 0];

    zones.forEach(function (z) {
      var p = zonePrice(z);
      sum[0] += p[0]; sum[1] += p[1];
      lines.push({ zoneId: z.id, name: z.name, note: tierOf(z).name, range: p });
    });

    if (!zones.length) return { lines: [], total: [0, 0], zones: zones, winter: false };

    var inst = NS.SERVICES.install;
    lines.push({
      service: true, name: inst.name, note: inst.note,
      range: [sum[0] * inst.rate, sum[1] * inst.rate]
    });
    lines.push({ service: true, name: NS.SERVICES.power.name, note: NS.SERVICES.power.note, range: NS.SERVICES.power.flat.slice() });
    lines.push({ service: true, name: NS.SERVICES.logistics.name, note: NS.SERVICES.logistics.note, range: NS.SERVICES.logistics.flat.slice() });
    lines.push({ service: true, name: NS.SERVICES.tech.name, note: NS.SERVICES.tech.note, range: null });

    var total = lines.reduce(function (acc, l) {
      if (l.range) { acc[0] += l.range[0]; acc[1] += l.range[1]; }
      return acc;
    }, [0, 0]);

    var winter = isWinterDate() && zones.some(function (z) { return z.outdoor; });
    return { lines: lines, total: total, zones: zones, winter: winter };
  }

  /* ---------- Рендер: атмосферы ---------- */

  function moodById(id) {
    return NS.ATMOSPHERES.filter(function (a) { return a.id === id; })[0];
  }

  function applyMood() {
    document.documentElement.dataset.mood = state.mood;
  }

  function renderAtmoRail() {
    var rail = $('[data-atmo-rail]');
    if (!rail) return;
    rail.innerHTML = NS.ATMOSPHERES.map(function (a) {
      return '<button type="button" class="acard" role="radio" data-mood-set="' + a.id + '"' +
        ' style="--a1:' + a.palette[0] + ';--a2:' + a.palette[1] + ';--a3:' + a.palette[2] + '">' +
        '<span class="acard__art">' +
          '<img src="' + a.img + '" alt="Пример света: ' + a.name + '" loading="lazy" decoding="async">' +
        '</span>' +
        '<span class="acard__check">✓</span>' +
        '<span class="acard__body">' +
          '<span class="acard__name">' + a.name + '</span>' +
          '<span class="acard__lead">' + a.lead + '</span>' +
          '<span class="acard__event">' + a.event + '</span>' +
          '<span class="acard__tags">' + a.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</span>' +
        '</span></button>';
    }).join('');
  }

  function renderChips() {
    var quick = ['classic', 'neon', 'garden', 'club'];
    var hero = $('[data-mood-chips]');
    if (hero) {
      hero.innerHTML = quick.map(function (id) {
        var a = moodById(id);
        return '<button type="button" class="chip" data-mood-set="' + id + '">' +
          '<i class="chip__dot" style="--c:' + a.palette[0] + '"></i>' + a.name + '</button>';
      }).join('');
    }

    var second = $('[data-mood-second]');
    if (second) {
      second.innerHTML = '<button type="button" class="chip" data-mood-second="">не нужна</button>' +
        NS.ATMOSPHERES.map(function (a) {
          return '<button type="button" class="chip" data-mood-second="' + a.id + '">' +
            '<i class="chip__dot" style="--c:' + a.palette[0] + '"></i>' + a.name + '</button>';
        }).join('');
    }
  }

  function renderGuests() {
    var box = $('[data-guests]');
    if (!box) return;
    box.innerHTML = NS.GUEST_TIERS.map(function (g) {
      return '<button type="button" role="radio" data-guest="' + g.id + '">' + g.label + '</button>';
    }).join('');
  }

  /* ---------- Рендер: зоны ---------- */

  function renderZones() {
    var box = $('[data-zones]');
    if (!box) return;
    box.innerHTML = NS.ZONES.map(function (z) {
      return '<article class="zcard" data-zcard="' + z.id + '">' +
        '<button type="button" class="zcard__head" data-zone-toggle="' + z.id + '" aria-pressed="false">' +
          '<span class="zcard__toggle" aria-hidden="true"></span>' +
          '<img class="zcard__thumb" src="' + z.img + '" alt="" loading="lazy" decoding="async">' +
          '<span class="zcard__title"><b>' + z.name + '</b><span>' + z.lead + '</span></span>' +
          '<span class="zcard__price" data-zone-price="' + z.id + '">от ' + fmt(z.tiers[0].min) + ' ₽</span>' +
        '</button>' +
        '<div class="zcard__tiers">' +
          z.tiers.map(function (t) {
            return '<button type="button" class="tier" data-tier="' + z.id + ':' + t.id + '">' +
              '<b>' + t.name + '</b><span>' + t.desc + '</span>' +
              '<i data-tier-price="' + z.id + ':' + t.id + '">' + fmt(t.min) + ' – ' + fmt(t.max) + ' ₽</i>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Синхронизация UI ---------- */

  function syncMoodUI() {
    $$('[data-mood-set]').forEach(function (el) {
      var on = el.dataset.moodSet === state.mood;
      el.classList.toggle('is-active', on);
      if (el.getAttribute('role') === 'radio') el.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $$('[data-mood-second]').forEach(function (el) {
      el.classList.toggle('is-active', (el.dataset.moodSecond || '') === (state.moodSecond || ''));
    });
  }

  function syncZonesUI() {
    var k = guestK();
    var winter = isWinterDate();

    NS.ZONES.forEach(function (z) {
      var st = state.zones[z.id];
      var card = $('[data-zcard="' + z.id + '"]');
      if (!card) return;

      card.classList.toggle('is-on', st.on);
      var head = $('[data-zone-toggle="' + z.id + '"]', card);
      if (head) head.setAttribute('aria-pressed', st.on ? 'true' : 'false');

      var mult = k * (z.outdoor && winter ? NS.WINTER_K : 1);
      z.tiers.forEach(function (t) {
        var el = $('[data-tier-price="' + z.id + ':' + t.id + '"]');
        if (el) el.textContent = fmt(t.min * mult) + ' – ' + fmt(t.max * mult) + ' ₽';
        var btn = $('[data-tier="' + z.id + ':' + t.id + '"]');
        if (btn) btn.classList.toggle('is-active', st.tier === t.id);
      });

      var price = $('[data-zone-price="' + z.id + '"]');
      if (price) {
        price.textContent = st.on ? fmtRange(zonePrice(z)) : 'от ' + fmt(z.tiers[0].min * mult) + ' ₽';
      }

      var g = document.querySelector('.zone[data-zone="' + z.id + '"]');
      if (g) g.classList.toggle('is-on', st.on);
    });

    var venue = $('[data-venue]');
    if (venue) venue.classList.toggle('has-zones', activeZones().length > 0);
  }

  function syncGuestsUI() {
    $$('[data-guest]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.guest === state.guests);
    });
  }

  function syncBudgetUI(est) {
    var input = $('[data-budget]');
    var out = $('[data-budget-value]');
    var hint = $('[data-budget-hint]');
    if (!input) return;

    input.value = state.budget;
    var pct = (state.budget - input.min) / (input.max - input.min) * 100;
    input.style.setProperty('--fill', pct + '%');
    if (out) out.textContent = fmt(state.budget) + ' ₽';

    if (!hint) return;
    if (!est.zones.length) {
      hint.textContent = 'Включите зоны — покажем, как они укладываются в ориентир.';
      return;
    }
    var mid = (est.total[0] + est.total[1]) / 2;
    if (est.total[0] > state.budget) {
      var over = Math.round((est.total[0] / state.budget - 1) * 100);
      hint.innerHTML = 'Набранный состав выходит за ориентир примерно на <b>' + over +
        '%</b>. Можно опустить одну зону в базовый вариант — покажем, какую.';
    } else if (mid < state.budget * 0.72) {
      hint.innerHTML = 'В ориентир помещается ещё одна зона или апгрейд текущей — <b>запас есть</b>.';
    } else {
      hint.innerHTML = 'Состав <b>укладывается</b> в ориентир бюджета.';
    }
  }

  /* ---------- Смета ---------- */

  function renderEstimate() {
    var est = estimate();
    var box = $('[data-estimate-lines]');
    var totalEl = $('[data-estimate-total]');
    var goBtn = $('[data-goto-result]');
    if (!box) return est;

    if (!est.lines.length) {
      box.innerHTML = '<li class="empty">Пока пусто. Включите первую зону — смета соберётся сама.</li>';
      if (totalEl) totalEl.textContent = '—';
      if (goBtn) goBtn.disabled = true;
    } else {
      box.innerHTML = est.lines.map(function (l) {
        var right = l.range === null ? 'входит'
          : (l.range[0] === 0 && l.range[1] === 0 ? 'входит' : fmtRange(l.range));
        return '<li' + (l.service ? ' class="is-service"' : ' data-line-zone="' + l.zoneId + '"') + '>' +
          '<span>' + l.name + '<i>' + l.note + '</i></span><b>' + right + '</b></li>';
      }).join('');
      if (totalEl) totalEl.textContent = fmtRange(est.total);
      if (goBtn) goBtn.disabled = false;
    }

    var estBox = $('[data-estimate]');
    var warn = estBox && estBox.querySelector('.estimate__over');
    if (warn) warn.remove();
    if (est.winter && estBox) {
      var note = document.createElement('p');
      note.className = 'estimate__over';
      note.innerHTML = 'Дата зимняя: уличные зоны посчитаны с надбавкой ' +
        Math.round((NS.WINTER_K - 1) * 100) + '% на влагозащиту и обогрев. ' +
        'Предложим и вариант с переносом этих зон внутрь.';
      estBox.insertBefore(note, estBox.querySelector('.estimate__total').nextSibling);
    }

    // Дублируем итог в плавающую строку — она видна во время выбора зон.
    var barTotal = $('[data-cfgbar-total]');
    var barZones = $('[data-cfgbar-zones]');
    if (barTotal) barTotal.textContent = est.lines.length ? fmtRange(est.total) : '—';
    if (barZones) {
      barZones.textContent = est.zones.length +
        ' ' + plural(est.zones.length, ['зона', 'зоны', 'зон']) + ' выбрано';
    }

    syncBudgetUI(est);
    return est;
  }

  /* ---------- Moodboard ---------- */

  function eventTitle() {
    var a = moodById(state.mood);
    var d = '';
    if (state.date) {
      var dt = new Date(state.date + 'T12:00:00');
      if (!isNaN(dt)) d = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    return { mood: a, date: d };
  }

  function renderMoodboard() {
    var est = estimate();
    var t = eventTitle();
    var second = state.moodSecond ? moodById(state.moodSecond) : null;

    var title = $('[data-mb-title]');
    var sub = $('[data-mb-sub]');
    var pal = $('[data-mb-palette]');
    var tiles = $('[data-mb-tiles]');
    var count = $('[data-mb-count]');
    var total = $('[data-mb-total]');

    if (title) title.textContent = t.mood.name + (t.date ? ' · ' + t.date : '');
    if (sub) {
      var guests = NS.GUEST_TIERS.filter(function (g) { return g.id === state.guests; })[0];
      sub.textContent = t.mood.lead + ' · ' + (guests ? guests.label + ' гостей' : '') +
        (second ? ' · танцпол в стиле «' + second.name + '»' : '');
    }
    if (pal) {
      pal.innerHTML = t.mood.palette.slice(0, 3).map(function (c) {
        return '<i style="--c:' + c + '"></i>';
      }).join('');
    }

    if (tiles) {
      tiles.innerHTML = est.zones.map(function (z) {
        var useSecond = second && (z.id === 'dancefloor' || z.id === 'photozone');
        var p = useSecond ? second.palette : t.mood.palette;
        var style = '--accent:' + p[0] + ';--accent-3:' + p[2] + ';--deep:' + p[3];
        return '<div class="mtile" style="' + style + '">' +
          '<img src="' + z.img + '" alt="' + z.name + '" loading="lazy" decoding="async">' +
          '<b>' + z.name + '</b><span>' + tierOf(z).name + '</span></div>';
      }).join('');
    }

    if (count) count.textContent = est.zones.length + ' ' + plural(est.zones.length, ['зона', 'зоны', 'зон']) + ' · смета';
    if (total) total.textContent = est.lines.length ? fmtRange(est.total) : '—';

    var briefBox = $('[data-final-brief]');
    var briefText = $('[data-final-brief-text]');
    if (briefBox && briefText) {
      if (est.zones.length) {
        briefBox.hidden = false;
        briefText.textContent = t.mood.name + (t.date ? ', ' + t.date : '') + ' · ' +
          est.zones.map(function (z) { return z.name.toLowerCase(); }).join(', ') +
          ' · ' + fmtRange(est.total);
      } else {
        briefBox.hidden = true;
      }
    }
    return est;
  }

  function plural(n, forms) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  /* ---------- Публичное обновление ---------- */

  function update() {
    applyMood();
    syncMoodUI();
    syncZonesUI();
    syncGuestsUI();
    renderEstimate();
    renderMoodboard();
    save();
  }

  /* ---------- Инициализация ---------- */

  function init() {
    renderAtmoRail();
    renderChips();
    renderGuests();
    renderZones();

    var restored = load();

    // Атмосферы и чипы
    document.addEventListener('click', function (e) {
      var set = e.target.closest('[data-mood-set]');
      if (set) { state.mood = set.dataset.moodSet; update(); return; }

      var sec = e.target.closest('[data-mood-second]');
      if (sec) { state.moodSecond = sec.dataset.moodSecond || null; update(); return; }

      var guest = e.target.closest('[data-guest]');
      if (guest) { state.guests = guest.dataset.guest; update(); return; }

      var toggle = e.target.closest('[data-zone-toggle]');
      if (toggle) {
        var id = toggle.dataset.zoneToggle;
        state.zones[id].on = !state.zones[id].on;
        update();
        return;
      }

      var tier = e.target.closest('[data-tier]');
      if (tier) {
        var parts = tier.dataset.tier.split(':');
        state.zones[parts[0]].tier = parts[1];
        if (!state.zones[parts[0]].on) state.zones[parts[0]].on = true;
        update();
        return;
      }

      var reset = e.target.closest('[data-reset]');
      if (reset) {
        NS.ZONES.forEach(function (z) { state.zones[z.id] = { on: false, tier: z.tiers[0].id }; });
        update();
        NS.toast('Конструктор очищен — можно собрать заново');
        return;
      }
    });

    // Бюджет
    var budget = $('[data-budget]');
    if (budget) {
      budget.addEventListener('input', function () {
        state.budget = +budget.value;
        syncBudgetUI(estimate());
        save();
      });
    }

    // Дата в конструкторе — общая для сметы
    var mainDate = $('[data-datecheck-main]');
    if (mainDate) {
      mainDate.addEventListener('change', function () {
        state.date = mainDate.value;
        update();
      });
    }

    // Подсветка зоны на плане при наведении на строку сметы
    var lines = $('[data-estimate-lines]');
    if (lines) {
      lines.addEventListener('mouseover', function (e) {
        var li = e.target.closest('[data-line-zone]');
        if (!li) return;
        var g = document.querySelector('.zone[data-zone="' + li.dataset.lineZone + '"]');
        if (g) g.classList.add('is-hot');
      });
      lines.addEventListener('mouseout', function (e) {
        var li = e.target.closest('[data-line-zone]');
        if (!li) return;
        var g = document.querySelector('.zone[data-zone="' + li.dataset.lineZone + '"]');
        if (g) g.classList.remove('is-hot');
      });
    }

    // Переход к результату
    var go = $('[data-goto-result]');
    if (go) {
      go.addEventListener('click', function () {
        var res = $('[data-result]');
        if (!res) return;
        res.hidden = false;
        renderMoodboard();
        res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Восстановление даты и бюджета в полях
    if (mainDate && state.date) mainDate.value = state.date;

    update();

    if (restored && activeZones().length) {
      var res = $('[data-result]');
      if (res) res.hidden = false;
      setTimeout(function () {
        NS.toast('Мы сохранили вашу прошлую конфигурацию — можно продолжить');
      }, 1200);
    }
  }

  NS.cfg = {
    init: init,
    state: state,
    estimate: estimate,
    update: update,
    fmtRange: fmtRange,
    setMood: function (id) { if (moodById(id)) { state.mood = id; update(); } },
    setDate: function (v) { state.date = v; update(); }
  };
})(window.LUMEN);
