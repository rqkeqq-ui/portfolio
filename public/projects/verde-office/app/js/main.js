/* ═══════════════════ VERDE OFFICE ═══════════════════ */
(function () {
'use strict';

var P = window.VerdePricing;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var money = P.money, plural = P.plural, clamp = P.clamp, round100 = P.round100;
var PKG = P.PKG;
var STORE = 'verde:calc';
var MAX_PLAN = 25 * 1024 * 1024;

/* ─────────── состояние ─────────── */
var st = P.sanitize(null);
try {
  var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (saved) st = P.sanitize(saved);
} catch (e) { /* пустое или повреждённое хранилище — остаются значения по умолчанию */ }

var planFileObj = null;

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {}
}
function compute() { return P.compute(st); }

/* ─────────── вывод сметы ─────────── */
var out = {
  total: $('#oTotal'), floor: $('#oFloor'), mid: $('#oMid'), small: $('#oSmall'),
  wallLi: $('#oWallLi'), wall: $('#oWall'), lampLi: $('#oLampLi'), lamp: $('#oLamp'),
  pkg: $('#oPkg'), visits: $('#oVisits'), price: $('#oPrice'), priceK: $('#oPriceK'),
  brk: $('#oBreak'), capex: $('#oCapex'), capexV: $('#oCapexV'),
  bar: $('#oBar'), ready: $('#oReady'), mPrice: $('#mPrice')
};

function render() {
  var c = compute();

  out.total.textContent = c.total;
  out.floor.textContent = c.floor;
  out.mid.textContent = c.mid;
  out.small.textContent = c.small;

  out.wallLi.hidden = !c.wallArea;
  out.wall.textContent = c.wallArea;
  out.lampLi.hidden = !c.lamps;
  out.lamp.textContent = c.lamps;

  out.pkg.textContent = c.pkgName;
  out.visits.textContent = c.visits + ' ' + plural(c.visits, ['визит', 'визита', 'визитов']) + ' фитотехника в месяц';

  out.priceK.textContent = st.net
    ? 'Ежемесячно за ' + c.loc + ' ' + plural(c.loc, ['локацию', 'локации', 'локаций'])
    : 'Ежемесячный платёж';
  out.price.textContent = money(c.monthly);
  if (out.mPrice) out.mPrice.textContent = money(c.monthly);

  var rows = [];
  if (st.mode === 'rent') rows.push(['Аренда растений и кашпо', money(round100(c.rent)) + ' ₽']);
  rows.push(['Сервис, ' + c.visits + ' ' + plural(c.visits, ['визит', 'визита', 'визитов']) + '/мес', money(round100(c.service)) + ' ₽']);
  if (c.wallArea) rows.push(['Фитостена, ' + c.wallArea + ' м²', 'включена']);
  if (c.lamps) rows.push(['Фитолампы, ' + c.lamps + ' шт.', st.mode === 'rent' ? 'включены' : 'в закупке']);
  if (c.disc) rows.push(['Скидка за сеть из ' + c.loc + ' ' + plural(c.loc, ['филиала', 'филиалов', 'филиалов']), '−' + Math.round(c.disc * 100) + '%']);
  out.brk.innerHTML = rows.map(function (r) { return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>'; }).join('');

  out.capex.hidden = st.mode !== 'buy';
  out.capexV.textContent = money(c.capex) + ' ₽';

  out.bar.style.width = (st.planName ? 90 : 70) + '%';
  out.ready.textContent = st.planName
    ? 'Смета готова на 90% — план офиса получен, фитодизайнер сделает точную схему расстановки.'
    : 'Смета готова на 70% — приложите план офиса, чтобы получить точный проект расстановки.';

  renderBrief(c);
  renderVs(c);
  save();
}

/* сравнение аренды и покупки на горизонте 36 месяцев */
function renderVs(c) {
  if (!$('#vsCalc')) return;
  var cheaper = Math.min(c.rent36, c.buy36), pricier = Math.max(c.rent36, c.buy36);
  var w = function (v) { return Math.round(v / pricier * 100) + '%'; };
  $('#vsKey').textContent = 'Ваш офис ' + st.area + ' м², ' + c.total + ' ' +
    plural(c.total, ['растение', 'растения', 'растений']) + ', пакет ' + c.pkgName + ' — расходы за 36 месяцев';
  $('#vsRentBar').style.width = w(c.rent36);
  $('#vsBuyBar').style.width = w(c.buy36);
  $('#vsRentSum').textContent = '≈ ' + money(c.rent36) + ' ₽';
  $('#vsBuySum').textContent = '≈ ' + money(c.buy36) + ' ₽';
  $('#vsNote').textContent = (c.buy36 < c.rent36 ? 'Покупка' : 'Аренда') + ' выгоднее на ' +
    money(pricier - cheaper) + ' ₽ за три года. В покупку входит разовая закупка растений и кашпо (' +
    money(c.buy36 - c.service * 36) + ' ₽), далее — только сервис.';
}

/* ─────────── резюме в брифе ─────────── */
function renderBrief(c) {
  var dl = $('#briefSum');
  if (!dl) return;
  var rows = [
    ['Площадь офиса', st.area + ' м²'],
    ['Сотрудников', st.staff],
    ['Освещение', P.LIGHT_TXT[st.light]],
    ['Зоны', st.zones.map(function (z) { return P.ZONE_TXT[z]; }).join(', ') || '—'],
    ['Растений', c.total + (c.wallArea ? ' + фитостена ' + c.wallArea + ' м²' : '')],
    ['Пакет', c.pkgName],
    ['Формат', st.mode === 'rent' ? 'аренда растений' : 'покупка растений']
  ];
  if (st.net) rows.push(['Филиалов', c.loc + (c.disc ? ' (скидка ' + Math.round(c.disc * 100) + '%)' : '')]);
  rows.push(['Платёж', money(c.monthly) + ' ₽/мес']);
  if (st.mode === 'buy' && c.capex) rows.push(['Разовая закупка', money(c.capex) + ' ₽']);

  dl.innerHTML = rows.map(function (r) {
    var hl = r[0] === 'Платёж' ? ' class="hl"' : '';
    return '<div><dt>' + r[0] + '</dt><dd' + hl + '>' + r[1] + '</dd></div>';
  }).join('');

  var fw = $('#briefFile');
  if (fw) { fw.hidden = !st.planName; $('#briefFileName').textContent = st.planName || '—'; }
}

/* ─────────── привязка формы калькулятора ─────────── */
function bindPair(rangeId, numId, key, min, max) {
  var r = $(rangeId), n = $(numId);
  if (!r || !n) return;
  r.value = st[key]; n.value = st[key];
  var apply = function (v) {
    st[key] = v;
    if (key === 'area') st.pkgLocked = false;
    render();
  };
  r.addEventListener('input', function () { n.value = r.value; apply(+r.value); });
  n.addEventListener('input', function () {
    var v = clamp(+n.value || min, min, max);
    r.value = v; apply(v);
  });
  n.addEventListener('blur', function () { n.value = st[key]; });
}
bindPair('#area', '#areaN', 'area', 30, 2000);
bindPair('#staff', '#staffN', 'staff', 5, 500);

$$('input[name="light"]').forEach(function (i) {
  i.checked = i.value === st.light;
  i.addEventListener('change', function () { if (i.checked) { st.light = i.value; render(); } });
});

$$('input[name="zone"]').forEach(function (i) {
  i.checked = st.zones.indexOf(i.value) > -1;
  i.addEventListener('change', function () {
    st.zones = $$('input[name="zone"]:checked').map(function (x) { return x.value; });
    syncSub(); render();
  });
});

var meetN = $('#meetN'), wallCb = $('#wall');
meetN.value = st.meetRooms;
meetN.addEventListener('input', function () { st.meetRooms = clamp(+meetN.value || 1, 1, 30); render(); });
wallCb.checked = st.wall;
wallCb.addEventListener('change', function () { st.wall = wallCb.checked; render(); });

function syncSub() {
  var showMeet = st.zones.indexOf('meeting') > -1;
  var showWall = st.zones.indexOf('reception') > -1;
  meetN.parentElement.style.display = showMeet ? '' : 'none';
  wallCb.parentElement.style.display = showWall ? '' : 'none';
  $('#meetWrap').hidden = !showMeet && !showWall;
}
syncSub();

/* переключатель аренда/покупка — единое состояние на всю страницу */
var HINTS = {
  rent: 'Растения остаются нашими: нулевые вложения на старте, замена всегда включена, один платёж в месяц.',
  buy: 'Растения переходят вам на баланс. Ежемесячно платите только за сервис, замена — в пределах лимита пакета.'
};
function setMode(m) {
  st.mode = m;
  $$('.seg__b').forEach(function (b) {
    var on = b.dataset.mode === m;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  $('#modeHint').textContent = HINTS[m];
  $$('[data-price]').forEach(function (el) {
    var p = PKG[el.dataset.price];
    el.textContent = m === 'rent' ? p.rentRate : p.rate;
  });
  $$('[data-price-note]').forEach(function (el) {
    el.textContent = m === 'rent' ? '₽ за растение / мес, аренда и сервис' : '₽ за растение / мес, только сервис';
  });
  render();
}
$$('.seg__b').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });

$$('[data-pick]').forEach(function (b) {
  b.addEventListener('click', function () { st.pkg = b.dataset.pick; st.pkgLocked = true; render(); });
});

/* сеть филиалов */
var netCb = $('#net'), netWrap = $('#netWrap'), netN = $('#netN');
netCb.checked = st.net;
netWrap.hidden = !st.net;
netN.value = st.locations;
netCb.addEventListener('change', function () { st.net = netCb.checked; netWrap.hidden = !st.net; render(); });
netN.addEventListener('input', function () { st.locations = clamp(+netN.value || 2, 2, 200); render(); });
$('#netCalcBtn').addEventListener('click', function () {
  if (!netCb.checked) { netCb.checked = true; st.net = true; netWrap.hidden = false; render(); }
});

/* ─────────── загрузка плана офиса ─────────── */
var drop = $('#drop'), planInput = $('#planFile');
if (st.planName) markFile(st.planName);

planInput.addEventListener('change', function () {
  if (planInput.files && planInput.files[0]) takeFile(planInput.files[0]);
});
['dragenter', 'dragover'].forEach(function (ev) {
  drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
});
['dragleave', 'drop'].forEach(function (ev) {
  drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
});
drop.addEventListener('drop', function (e) {
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) takeFile(f);
});

function takeFile(f) {
  if (f.size > MAX_PLAN) {
    $('#dropHint').textContent = 'Файл больше 25 МБ — пришлите ссылку на облако в комментарии к брифу';
    return;
  }
  planFileObj = f;
  st.planName = f.name;
  markFile(f.name, f.size);
  render();
}
function markFile(name, size) {
  drop.classList.add('is-done');
  $('#dropTitle').textContent = name;
  $('#dropHint').textContent = (size ? fileSize(size) + ' · ' : '') + 'файл прикреплён, нажмите чтобы заменить';
}
function fileSize(b) {
  return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' КБ' : (b / 1048576).toFixed(1) + ' МБ';
}
function readAsBase64(file) {
  return new Promise(function (resolve, reject) {
    var fr = new FileReader();
    fr.onload = function () { resolve(String(fr.result).split(',')[1] || ''); };
    fr.onerror = function () { reject(fr.error); };
    fr.readAsDataURL(file);
  });
}

/* ─────────── слайдер «до / после» ─────────── */
var CASES = [
  { area: '200 м²', plants: '38 растений', pkg: 'Green Office', days: '1 день', price: '24 300 ₽/мес' },
  { area: '180 м²', plants: '26 + фитостена', pkg: 'Green Premium', days: '2 дня', price: '38 200 ₽/мес' },
  { area: '90 м²', plants: '17 растений', pkg: 'Green Office', days: '1 день', price: '10 600 ₽/мес' }
];
var rng = $('#cmpRange'), handle = $('#cmpHandle'), afterLayer = $('#cmpAfter'), facts = $('#cmpFacts');

function setSplit(v) {
  afterLayer.style.clipPath = 'inset(0 0 0 ' + v + '%)';
  handle.style.left = v + '%';
}
setSplit(rng.value);
rng.addEventListener('input', function () { setSplit(rng.value); });

function showCase(i) {
  $$('.cmp__layer .scene').forEach(function (s) { s.hidden = +s.dataset.case !== i; });
  var c = CASES[i];
  facts.innerHTML =
    '<div><dt>Площадь</dt><dd>' + c.area + '</dd></div>' +
    '<div><dt>Объём</dt><dd>' + c.plants + '</dd></div>' +
    '<div><dt>Пакет</dt><dd>' + c.pkg + '</dd></div>' +
    '<div><dt>Установка</dt><dd>' + c.days + '</dd></div>' +
    '<div><dt>Платёж</dt><dd>' + c.price + '</dd></div>';
}
$$('.cmp__tab').forEach(function (t) {
  t.addEventListener('click', function () {
    $$('.cmp__tab').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
    t.classList.add('is-on'); t.setAttribute('aria-selected', 'true');
    showCase(+t.dataset.case);
  });
});
showCase(0);

/* ─────────── отправка брифа ─────────── */
var bf = $('#briefForm'), doneBox = $('#done'), submitBtn = $('#briefSubmit');

bf.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!bf.checkValidity()) { bf.reportValidity(); return; }
  sendBrief();
});

function sendBrief() {
  var fd = new FormData(bf);
  var contact = {
    company: fd.get('company'), city: fd.get('city'), name: fd.get('name'),
    role: fd.get('role'), email: fd.get('email'), phone: fd.get('phone'), comment: fd.get('comment')
  };
  setBusy(true);

  var filePart = planFileObj
    ? readAsBase64(planFileObj).then(function (b64) {
        return { name: planFileObj.name, size: planFileObj.size, type: planFileObj.type, data: b64 };
      }).catch(function () { return null; })
    : Promise.resolve(null);

  filePart.then(function (plan) {
    return fetch('api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: contact, calc: st, plan: plan })
    });
  }).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (data) {
    if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'bad response');
    showDone(contact, data.kpUrl, data.emailSent === true);
  }).catch(function () {
    /* сервер недоступен — лендинг открыт как статика. Расчёт всё равно показываем. */
    showDone(contact, null, false);
  });
}

function setBusy(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? 'Собираем КП…' : 'Собрать демо-КП';
}

function showDone(contact, kpUrl, emailSent) {
  var c = compute();
  $('#doneTxt').textContent =
    'КП для ' + contact.company + ' (' + contact.city + ') собрано: офис ' + st.area + ' м², ' +
    c.total + ' ' + plural(c.total, ['растение', 'растения', 'растений']) + ', пакет ' + c.pkgName +
    ', ' + money(c.monthly) + ' ₽/мес.';

  var link = $('#doneKp'), note = $('#doneNote');
  if (kpUrl) {
    link.href = kpUrl;
    link.hidden = false;
    note.textContent = emailSent
      ? 'Копия отправлена на ' + contact.email + '. Документ также можно открыть прямо сейчас.'
      : 'КП сохранено на демо-сервере. Почта не подключена: откройте документ по кнопке и сохраните его в PDF.';
  } else {
    link.hidden = true;
    note.textContent = 'Лендинг открыт без бэкенда, поэтому письмо не ушло — запустите server.js, чтобы бриф сохранялся и КП собиралось автоматически.';
  }
  setBusy(false);
  $('.brief').hidden = true;
  doneBox.hidden = false;
  doneBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ─────────── шапка, меню, появление секций ─────────── */
var hdr = $('#hdr'), hdrCta = $('#hdrCta'), burger = $('#burger'), nav = $('.hdr__nav'), mbar = $('#mbar');
var calcSec = $('#calc');

/* этап воронки считаем по позиции скролла: не зависит от IntersectionObserver,
   который может не сработать в фоновой или незакомпонованной вкладке */
function syncStage() {
  var passed = calcSec.getBoundingClientRect().bottom < 0;
  var narrow = window.innerWidth <= 720;
  hdrCta.textContent = passed ? 'Получить КП' : (narrow ? 'Рассчитать' : 'Рассчитать озеленение');
  hdrCta.setAttribute('href', passed ? '#brief' : '#calc');
  mbar.hidden = false;
  mbar.classList.toggle('is-on', passed && window.innerWidth <= 860 && doneBox.hidden);
}
window.addEventListener('scroll', function () {
  hdr.classList.toggle('is-stuck', window.scrollY > 12);
  syncStage();
}, { passive: true });
window.addEventListener('resize', syncStage, { passive: true });
syncStage();

burger.addEventListener('click', function () {
  var open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
});
$$('.hdr__nav a').forEach(function (a) {
  a.addEventListener('click', function () { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); });
});

function revealAll() { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* если наблюдатель не доставил ни одного колбэка — показываем всё без анимации,
     иначе контент навсегда останется прозрачным */
  window.addEventListener('load', function () {
    setTimeout(function () { if (!$('.reveal.is-in')) revealAll(); }, 1200);
  });
} else {
  revealAll();
}

setMode(st.mode);
render();
})();
