/* ═══════════ VERDE OFFICE · модель расчёта ═══════════
   Один источник истины для калькулятора в браузере и для сборки КП на сервере.
   Работает и как <script>, и как require() — менять цены нужно только здесь. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VerdePricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PKG = {
    start:   { name: 'Green Start',   rate: 230, rentRate: 570, visits: 2, swap: 'до 10% парка в год' },
    office:  { name: 'Green Office',  rate: 300, rentRate: 640, visits: 3, swap: 'до 20% парка в год' },
    premium: { name: 'Green Premium', rate: 400, rentRate: 740, visits: 4, swap: 'без лимита по SLA' }
  };
  var RENT = { floor: 780, mid: 240, small: 90, wall: 2200 };
  var BUY  = { floor: 12000, mid: 3200, small: 900, wall: 38000, lamp: 2500 };
  var WALL_SERVICE = 1600;
  var LIGHT_K = { bright: 1, normal: 0.85, low: 0.7 };

  var LIGHT_TXT = { bright: 'панорамные окна, много света', normal: 'обычные окна', low: 'мало естественного света' };
  var ZONE_TXT = { open: 'open space', reception: 'ресепшн', meeting: 'переговорные', lounge: 'кухня и лаунж', cabinets: 'кабинеты' };

  var DEFAULTS = {
    area: 200, light: 'normal', staff: 60,
    zones: ['open', 'reception', 'meeting'], meetRooms: 3, wall: false,
    mode: 'rent', pkg: 'office', pkgLocked: false,
    net: false, locations: 4, planName: ''
  };

  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var round100 = function (n) { return Math.round(n / 100) * 100; };
  var money = function (n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); };

  function plural(n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  /* Приводит произвольный объект к валидному состоянию калькулятора.
     Нужен на сервере: данные приходят из браузера и доверять им нельзя. */
  function sanitize(raw) {
    var s = {}, src = (raw && typeof raw === 'object') ? raw : {};
    Object.keys(DEFAULTS).forEach(function (k) { s[k] = DEFAULTS[k]; });

    if (isFinite(src.area)) s.area = clamp(Math.round(+src.area), 30, 2000);
    if (isFinite(src.staff)) s.staff = clamp(Math.round(+src.staff), 5, 500);
    if (LIGHT_K[src.light]) s.light = src.light;
    if (Array.isArray(src.zones)) {
      var z = src.zones.filter(function (v) { return Object.prototype.hasOwnProperty.call(ZONE_TXT, v); });
      s.zones = z.slice(0, 5);
    }
    if (isFinite(src.meetRooms)) s.meetRooms = clamp(Math.round(+src.meetRooms), 1, 30);
    s.wall = src.wall === true;
    if (src.mode === 'buy' || src.mode === 'rent') s.mode = src.mode;
    if (PKG[src.pkg]) s.pkg = src.pkg;
    s.pkgLocked = src.pkgLocked === true;
    s.net = src.net === true;
    if (isFinite(src.locations)) s.locations = clamp(Math.round(+src.locations), 2, 200);
    if (typeof src.planName === 'string') s.planName = src.planName.slice(0, 160);
    return s;
  }

  function suggestPkg(area) {
    return area < 50 ? 'start' : (area <= 400 ? 'office' : 'premium');
  }

  function compute(st) {
    var k = LIGHT_K[st.light] || LIGHT_K.normal;
    var base = Math.max(st.area / 6, st.staff / 3) * k;
    if (st.zones.indexOf('open') === -1) base *= 0.55;

    var extra = 0;
    if (st.zones.indexOf('reception') > -1) extra += 4;
    if (st.zones.indexOf('meeting') > -1) extra += 2 * st.meetRooms;
    if (st.zones.indexOf('lounge') > -1) extra += 5;
    if (st.zones.indexOf('cabinets') > -1) extra += Math.ceil(st.staff / 25);

    var total = Math.max(8, Math.round(base + extra));
    var floor = Math.max(2, Math.round(total * 0.25));
    var small = Math.round(total * 0.3);
    var mid = Math.max(1, total - floor - small);
    total = floor + mid + small;

    var wallArea = (st.wall && st.zones.indexOf('reception') > -1) ? clamp(Math.round(st.area / 40), 3, 24) : 0;
    var lamps = st.light === 'low' ? Math.round(floor * 0.6 + mid * 0.25) : 0;

    var pkg = st.pkgLocked && PKG[st.pkg] ? st.pkg : suggestPkg(st.area);

    var loc = st.net ? Math.max(2, st.locations) : 1;
    var disc = 0;
    if (st.net) disc = loc >= 11 ? 0.15 : (loc >= 6 ? 0.1 : (loc >= 3 ? 0.05 : 0));
    var m = loc * (1 - disc);

    var service = (total * PKG[pkg].rate + wallArea * WALL_SERVICE) * m;
    var rent = (floor * RENT.floor + mid * RENT.mid + small * RENT.small + wallArea * RENT.wall) * m;
    var capex = (floor * BUY.floor + mid * BUY.mid + small * BUY.small + wallArea * BUY.wall + lamps * BUY.lamp) * m;

    return {
      total: total, floor: floor, mid: mid, small: small,
      wallArea: wallArea, lamps: lamps,
      pkg: pkg, pkgName: PKG[pkg].name, visits: PKG[pkg].visits, swap: PKG[pkg].swap,
      service: service, rent: rent,
      monthly: round100(st.mode === 'rent' ? service + rent : service),
      capex: round100(st.mode === 'buy' ? capex : 0),
      rent36: round100((service + rent) * 36),
      buy36: round100(capex + service * 36),
      loc: loc, disc: disc
    };
  }

  return {
    PKG: PKG, RENT: RENT, BUY: BUY, WALL_SERVICE: WALL_SERVICE,
    LIGHT_K: LIGHT_K, LIGHT_TXT: LIGHT_TXT, ZONE_TXT: ZONE_TXT, DEFAULTS: DEFAULTS,
    clamp: clamp, round100: round100, money: money, plural: plural,
    sanitize: sanitize, suggestPkg: suggestPkg, compute: compute
  };
});
