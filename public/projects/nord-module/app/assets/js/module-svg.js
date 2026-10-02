/* NORD MODULE — генератор SVG-визуализаций.
   Единый масштаб во всех видах: переключая модель, пользователь видит реальную разницу в размере. */

window.NM = window.NM || {};

(function (NM) {
  'use strict';

  var uidCounter = 0;
  function uid() { return 'nm' + (++uidCounter); }

  function num(v) { return Math.round(v * 100) / 100; }

  /* Оценка ширины строки: в SVG нет переноса, и не влезшая подпись
     просто вылезает за пределы своего блока. Поэтому подписи фильтруются заранее. */
  /* 0.72 — замеренная средняя ширина знака кириллицы в Inter с запасом.
     Лучше не показать подпись, чем размазать её по чертежу. */
  function textWidth(text, fontSize) { return text.length * fontSize * 0.72; }
  function fits(text, fontSize, maxWidth) { return textWidth(text, fontSize) <= maxWidth; }

  /* Возвращает первый вариант подписи, который помещается, иначе null */
  function pickLabel(variants, fontSize, maxWidth) {
    for (var i = 0; i < variants.length; i++) {
      if (variants[i] && fits(variants[i], fontSize, maxWidth)) return variants[i];
    }
    return null;
  }

  /* Детерминированный псевдослучайный генератор — деревья не «прыгают» при перерисовке */
  function rng(seed) {
    var s = seed || 1;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /* ---------- Палитры ---------- */

  var SEASONS = {
    dusk: {
      sky: [['#0E151F', 0], ['#1C2A37', 0.42], ['#3A4038', 0.74], ['#7A6244', 1]],
      ground: '#D6DEE4', groundDark: '#B9C6D0',
      treeNear: '#101820', treeFar: '#26333D',
      glass: '#FFC97A', glassEdge: '#F0A046', lit: true,
      haze: 'rgba(122,98,68,0.35)'
    },
    winter: {
      sky: [['#93AABC', 0], ['#BACBD6', 0.5], ['#E6EEF3', 1]],
      ground: '#F1F6F9', groundDark: '#D8E3EA',
      treeNear: '#26332F', treeFar: '#546462', lit: true,
      glass: '#F5C879', glassEdge: '#E0A254',
      haze: 'rgba(255,255,255,0.4)'
    },
    summer: {
      sky: [['#6E9BBE', 0], ['#A5C4D8', 0.5], ['#DAE7EC', 1]],
      ground: '#7E8D63', groundDark: '#697855',
      treeNear: '#2C4234', treeFar: '#4C6450', lit: false,
      glass: '#B7CEDA', glassEdge: '#94AFBE',
      haze: 'rgba(218,231,236,0.35)'
    }
  };

  var FACADES = {
    planken: { wall: '#A97240', line: '#8A5A2F', dir: 'h', pitch: 0.19, roof: '#242B2F', accent: null, trim: '#7A4E29' },
    painted: { wall: '#2C3733', line: '#222B28', dir: 'v', pitch: 0.15, roof: '#1B2220', accent: null, trim: '#1B2220' },
    fibro: { wall: '#C6CBC6', line: '#ADB3AD', dir: 'grid', pitch: 1.2, roof: '#3B4240', accent: null, trim: '#9BA29C' },
    combo: { wall: '#2C3733', line: '#222B28', dir: 'v', pitch: 0.15, roof: '#1B2220', accent: '#A97240', trim: '#1B2220' }
  };

  var INTERIORS = {
    light: { floor: '#EBDDC6', wall: '#2A2723', furn: '#C7AE85', furnLine: '#A98F66', label: '#4A4235', accent: '#C56B3E' },
    white: { floor: '#F3F1EB', wall: '#2A2A28', furn: '#D2CDC1', furnLine: '#B4AEA0', label: '#4A4A46', accent: '#C56B3E' },
    graphite: { floor: '#D9D6D0', wall: '#20262A', furn: '#8E9498', furnLine: '#6F767A', label: '#3A4145', accent: '#C56B3E' }
  };

  /* Габариты террас в метрах */
  var TERRACES = {
    none: null,
    open_s: { w: 2.5, d: 2.4, canopy: false, label: '6 м²' },
    open_l: { w: 4.0, d: 3.0, canopy: false, label: '12 м²' },
    canopy_s: { w: 2.5, d: 2.4, canopy: true, label: '6 м²' },
    canopy_l: { w: 4.0, d: 3.0, canopy: true, label: '12 м²' }
  };

  var FOUNDATIONS = { piles: 0.55, blocks: 0.34, own: 0.16 };

  NM.svg = {};
  NM.svg.TERRACES = TERRACES;

  /* ================= ЧЕЛОВЕК ДЛЯ МАСШТАБА ================= */

  var HUMAN_PATH = 'M0.21,0.175 C0.105,0.175 0.048,0.245 0.048,0.345 L0.032,0.555 L0.085,0.565 L0.105,0.405 ' +
    'L0.115,0.605 L0.092,1 L0.163,1 L0.205,0.665 L0.252,1 L0.322,1 L0.302,0.605 L0.312,0.405 ' +
    'L0.332,0.565 L0.385,0.555 L0.368,0.345 C0.368,0.245 0.312,0.175 0.21,0.175 Z';

  function human(x, baseY, heightPx, fill, opacity) {
    var s = heightPx;
    var headR = 0.075 * s;
    return '<g transform="translate(' + num(x) + ',' + num(baseY - s) + ')" fill="' + fill + '" opacity="' + (opacity || 1) + '">' +
      '<circle cx="' + num(0.21 * s) + '" cy="' + num(0.095 * s) + '" r="' + num(headR) + '"/>' +
      '<path d="' + HUMAN_PATH + '" transform="scale(' + num(s) + ')"/>' +
      '</g>';
  }

  /* ================= ЭКСТЕРЬЕР ================= */

  NM.svg.exterior = function (cfg, opts) {
    opts = opts || {};
    var model = NM.modelById(cfg.model);
    var season = SEASONS[opts.season || 'dusk'];
    var fac = FACADES[cfg.facade] || FACADES.planken;
    var terr = TERRACES[cfg.terrace] || null;

    var W = 1000, H = 560;
    var PX = 42;                       // единый масштаб: пикселей в метре
    var groundY = 424;
    var id = uid();

    var foundH = (FOUNDATIONS[cfg.foundation] || 0.55) * PX;
    var modH = model.height * PX;
    var modW = model.len * PX;
    var terrW = terr ? terr.w * PX : 0;

    var total = modW + terrW;
    var x0 = Math.round((W - total) / 2);
    var x1 = x0 + modW;
    var yBot = groundY - foundH;       // уровень пола
    var yTop = yBot - modH;            // уровень потолка

    var out = [];
    var defs = [];

    /* --- небо --- */
    defs.push('<linearGradient id="' + id + 'sky" x1="0" y1="0" x2="0" y2="1">' +
      season.sky.map(function (s) { return '<stop offset="' + s[1] + '" stop-color="' + s[0] + '"/>'; }).join('') +
      '</linearGradient>');
    defs.push('<linearGradient id="' + id + 'glass" x1="0" y1="0" x2="0.3" y2="1">' +
      '<stop offset="0" stop-color="' + season.glass + '"/>' +
      '<stop offset="1" stop-color="' + season.glassEdge + '"/></linearGradient>');
    defs.push('<radialGradient id="' + id + 'halo" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="' + season.glass + '" stop-opacity="0.5"/>' +
      '<stop offset="1" stop-color="' + season.glass + '" stop-opacity="0"/></radialGradient>');
    defs.push('<clipPath id="' + id + 'wall"><rect x="' + x0 + '" y="' + num(yTop) + '" width="' + num(modW) + '" height="' + num(modH) + '"/></clipPath>');

    out.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + id + 'sky)"/>');

    /* --- дальний лес --- */
    var rand = rng(opts.seed || (model.len * 37 + cfg.facade.length * 11));
    var far = [];
    for (var i = 0; i < 26; i++) {
      var tx = rand() * W;
      var th = 60 + rand() * 70;
      far.push(conifer(tx, groundY + 6, th, season.treeFar, 0.55));
    }
    out.push('<g opacity="0.75">' + far.join('') + '</g>');

    /* --- земля --- */
    out.push('<rect x="0" y="' + groundY + '" width="' + W + '" height="' + (H - groundY) + '" fill="' + season.ground + '"/>');
    out.push('<rect x="0" y="' + groundY + '" width="' + W + '" height="3" fill="' + season.groundDark + '" opacity="0.5"/>');
    out.push('<ellipse cx="' + num(x0 + total / 2) + '" cy="' + (groundY + 16) + '" rx="' + num(total / 2 + 40) + '" ry="14" fill="' + season.groundDark + '" opacity="0.45"/>');

    /* --- ближние деревья слева и справа --- */
    var near = [];
    near.push(conifer(52, groundY + 8, 250, season.treeNear, 1));
    near.push(conifer(120, groundY + 12, 180, season.treeNear, 1));
    near.push(conifer(W - 70, groundY + 10, 275, season.treeNear, 1));
    near.push(conifer(W - 145, groundY + 14, 165, season.treeNear, 1));
    out.push(near.join(''));

    /* --- терраса --- */
    if (terr) {
      var deckY = yBot + 0.06 * PX;
      var deckH = 0.12 * PX;
      out.push('<rect x="' + num(x1) + '" y="' + num(deckY) + '" width="' + num(terrW) + '" height="' + num(deckH) + '" fill="#8E6B48"/>');
      out.push('<rect x="' + num(x1) + '" y="' + num(deckY) + '" width="' + num(terrW) + '" height="3" fill="#B08A5F"/>');
      /* опоры */
      var posts = Math.max(2, Math.round(terr.w / 1.4));
      for (var p = 0; p <= posts; p++) {
        var px = x1 + (terrW / posts) * p - 3;
        out.push('<rect x="' + num(px) + '" y="' + num(deckY + deckH) + '" width="6" height="' + num(groundY - deckY - deckH) + '" fill="#5E4830"/>');
      }
      /* ограждение по дальнему краю */
      if (!terr.canopy) {
        out.push('<rect x="' + num(x1 + terrW - 5) + '" y="' + num(deckY - 0.95 * PX) + '" width="5" height="' + num(0.95 * PX) + '" fill="#6E5236"/>');
        out.push('<rect x="' + num(x1 + terrW - 1.1 * PX) + '" y="' + num(deckY - 0.9 * PX) + '" width="' + num(1.1 * PX) + '" height="4" fill="#6E5236"/>');
      }
    }

    /* --- основание --- */
    if (cfg.foundation === 'piles') {
      var pileCount = Math.max(3, Math.round(model.len / 2.2));
      for (var s1 = 0; s1 <= pileCount; s1++) {
        var sx = x0 + (modW / pileCount) * s1 - 5;
        sx = Math.min(sx, x1 - 11);
        out.push('<rect x="' + num(sx) + '" y="' + num(yBot) + '" width="11" height="' + num(foundH) + '" fill="#3A4147"/>');
      }
    } else if (cfg.foundation === 'blocks') {
      var blocks = Math.max(3, Math.round(model.len / 2.4));
      for (var b = 0; b <= blocks; b++) {
        var bx = x0 + (modW / blocks) * b - 13;
        bx = Math.min(bx, x1 - 27);
        out.push('<rect x="' + num(bx) + '" y="' + num(yBot) + '" width="27" height="' + num(foundH) + '" fill="#9A9C98"/>');
        out.push('<rect x="' + num(bx) + '" y="' + num(yBot) + '" width="27" height="3" fill="#B5B7B3"/>');
      }
    } else {
      out.push('<rect x="' + num(x0 - 12) + '" y="' + num(yBot) + '" width="' + num(modW + 24) + '" height="' + num(foundH) + '" fill="#A8ABA6"/>');
      out.push('<rect x="' + num(x0 - 12) + '" y="' + num(yBot) + '" width="' + num(modW + 24) + '" height="3" fill="#C0C3BE"/>');
    }

    /* --- корпус --- */
    out.push('<rect x="' + x0 + '" y="' + num(yTop) + '" width="' + num(modW) + '" height="' + num(modH) + '" fill="' + fac.wall + '"/>');
    out.push('<g clip-path="url(#' + id + 'wall)">' + cladding(x0, yTop, modW, modH, PX, fac) + '</g>');

    /* деревянная вставка для комбинированного фасада */
    if (fac.accent) {
      var accW = Math.min(2.4, model.len * 0.28) * PX;
      out.push('<rect x="' + num(x1 - accW - 0.3 * PX) + '" y="' + num(yTop) + '" width="' + num(accW) + '" height="' + num(modH) + '" fill="' + fac.accent + '"/>');
      out.push('<g clip-path="url(#' + id + 'wall)">' +
        cladding(x1 - accW - 0.3 * PX, yTop, accW, modH, PX, { dir: 'h', pitch: 0.19, line: '#8A5A2F' }) + '</g>');
    }

    /* --- окна --- */
    var winLeft = x0 + 0.55 * PX;
    var winRight = x1 - 2.15 * PX;
    var avail = winRight - winLeft;
    var glow = [];

    if (cfg.glazing === 'panoramic') {
      var gx = winLeft, gw = avail;
      var gy = yTop + 0.28 * PX, gh = (yBot - 0.06 * PX) - gy;
      out.push(windowRect(gx, gy, gw, gh, id, season, true));
      glow.push({ x: gx, y: gy, w: gw, h: gh });
    } else {
      var wS = cfg.glazing === 'large' ? { w: 2.0, h: 1.8, sill: 0.6 } : { w: 1.2, h: 1.4, sill: 0.95 };
      var ww = wS.w * PX, wh = wS.h * PX;
      var gap = 0.55 * PX;
      var count = (ww * 2 + gap) <= avail ? 2 : 1;
      if ((ww * 3 + gap * 2) <= avail) count = 3;
      var totalW = ww * count + gap * (count - 1);
      var startX = winLeft + (avail - totalW) / 2;
      var wy = yBot - (wS.sill + wS.h) * PX;
      for (var k = 0; k < count; k++) {
        var wx = startX + k * (ww + gap);
        out.push(windowRect(wx, wy, ww, wh, id, season, false));
        glow.push({ x: wx, y: wy, w: ww, h: wh });
      }
    }

    /* --- дверь --- */
    var dw = 1.0 * PX, dh = 2.1 * PX;
    var dx = x1 - 1.75 * PX, dy = yBot - dh;
    out.push('<rect x="' + num(dx) + '" y="' + num(dy) + '" width="' + num(dw) + '" height="' + num(dh) + '" fill="' + shade(fac.wall, -0.28) + '"/>');
    out.push('<rect x="' + num(dx + dw * 0.62) + '" y="' + num(dy + 0.16 * PX) + '" width="' + num(dw * 0.28) + '" height="' + num(dh - 0.32 * PX) + '" fill="url(#' + id + 'glass)" opacity="' + (season.lit ? 0.9 : 0.55) + '"/>');
    out.push('<rect x="' + num(dx + dw * 0.1) + '" y="' + num(dy + dh * 0.45) + '" width="4" height="' + num(0.32 * PX) + '" rx="2" fill="#D8D5CF"/>');

    /* --- кровля --- */
    var roofOver = 0.32 * PX;
    var roofTh = 0.18 * PX;
    var roofX = x0 - roofOver;
    var roofW = modW + roofOver * 2;
    if (terr && terr.canopy) roofW = (x1 + terrW + roofOver) - roofX;
    out.push('<rect x="' + num(roofX) + '" y="' + num(yTop - roofTh) + '" width="' + num(roofW) + '" height="' + num(roofTh) + '" fill="' + fac.roof + '"/>');
    out.push('<rect x="' + num(roofX) + '" y="' + num(yTop - roofTh) + '" width="' + num(roofW) + '" height="3" fill="' + shade(fac.roof, 0.22) + '"/>');

    /* --- стойки навеса --- */
    if (terr && terr.canopy) {
      var cpX = x1 + terrW - 0.28 * PX;
      out.push('<rect x="' + num(cpX) + '" y="' + num(yTop) + '" width="8" height="' + num(yBot - yTop + 0.06 * PX) + '" fill="' + shade(fac.roof, 0.1) + '"/>');
      if (terr.w > 3) {
        var cpX2 = x1 + terrW / 2;
        out.push('<rect x="' + num(cpX2) + '" y="' + num(yTop) + '" width="8" height="' + num(yBot - yTop + 0.06 * PX) + '" fill="' + shade(fac.roof, 0.1) + '"/>');
      }
    }

    /* --- свет из окон на землю --- */
    if (season.lit && opts.glow !== false) {
      var halos = glow.map(function (g) {
        return '<ellipse cx="' + num(g.x + g.w / 2) + '" cy="' + num(groundY + 4) + '" rx="' + num(g.w * 0.85) + '" ry="' + num(26 + g.h * 0.12) + '" fill="url(#' + id + 'halo)"/>';
      }).join('');
      out.push('<g opacity="0.6">' + halos + '</g>');
    }

    /* --- человек для масштаба --- */
    if (opts.human !== false) {
      out.push(human(x0 - 1.75 * PX, groundY + 4, 1.75 * PX, season.lit ? '#12181C' : '#1E2124', 0.9));
    }

    /* --- подпись габаритов --- */
    if (opts.dims !== false) {
      var dimY = groundY + 62;
      out.push('<g stroke="rgba(30,33,36,0.45)" stroke-width="1.5" fill="none">' +
        '<path d="M' + x0 + ' ' + (dimY - 7) + 'V' + (dimY + 7) + 'M' + num(x1) + ' ' + (dimY - 7) + 'V' + (dimY + 7) + 'M' + x0 + ' ' + dimY + 'H' + num(x1) + '"/></g>');
      out.push('<text x="' + num(x0 + modW / 2) + '" y="' + (dimY + 30) + '" text-anchor="middle" ' +
        'font-family="inherit" font-size="23" font-weight="500" fill="rgba(30,33,36,0.72)">' +
        model.len.toFixed(1).replace('.', ',') + ' м · ' + model.area + ' м²</text>');
    }

    return '<svg class="nm-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="Внешний вид модуля ' + model.name + '">' +
      '<defs>' + defs.join('') + '</defs>' + out.join('') + '</svg>';
  };

  function windowRect(x, y, w, h, id, season, panoramic) {
    var s = [];
    s.push('<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" fill="url(#' + id + 'glass)" opacity="' + (season.lit ? 1 : 0.72) + '"/>');
    s.push('<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" fill="none" stroke="rgba(20,24,28,0.55)" stroke-width="3"/>');
    if (panoramic) {
      var mullions = Math.max(2, Math.round(w / 68));
      for (var i = 1; i < mullions; i++) {
        s.push('<rect x="' + num(x + (w / mullions) * i - 1.5) + '" y="' + num(y) + '" width="3" height="' + num(h) + '" fill="rgba(20,24,28,0.5)"/>');
      }
    } else {
      s.push('<rect x="' + num(x + w / 2 - 1.5) + '" y="' + num(y) + '" width="3" height="' + num(h) + '" fill="rgba(20,24,28,0.45)"/>');
    }
    s.push('<path d="M' + num(x + w * 0.12) + ' ' + num(y + h) + 'L' + num(x + w * 0.52) + ' ' + num(y) + 'L' + num(x + w * 0.72) + ' ' + num(y) + 'L' + num(x + w * 0.32) + ' ' + num(y + h) + 'Z" fill="#ffffff" opacity="0.13"/>');
    return s.join('');
  }

  function cladding(x, y, w, h, PX, fac) {
    var lines = [];
    var pitch = fac.pitch * PX;
    if (fac.dir === 'h') {
      for (var i = 1; i * pitch < h; i++) {
        lines.push('<rect x="' + num(x) + '" y="' + num(y + i * pitch) + '" width="' + num(w) + '" height="1.6" fill="' + fac.line + '" opacity="0.75"/>');
      }
    } else if (fac.dir === 'v') {
      for (var j = 1; j * pitch < w; j++) {
        lines.push('<rect x="' + num(x + j * pitch) + '" y="' + num(y) + '" width="1.6" height="' + num(h) + '" fill="' + fac.line + '" opacity="0.8"/>');
      }
    } else {
      for (var g = 1; g * pitch < w; g++) {
        lines.push('<rect x="' + num(x + g * pitch) + '" y="' + num(y) + '" width="2" height="' + num(h) + '" fill="' + fac.line + '" opacity="0.85"/>');
      }
      lines.push('<rect x="' + num(x) + '" y="' + num(y + h * 0.52) + '" width="' + num(w) + '" height="2" fill="' + fac.line + '" opacity="0.85"/>');
    }
    return lines.join('');
  }

  function conifer(x, baseY, h, color, opacity) {
    var w = h * 0.34;
    var tiers = 4;
    var parts = ['<g fill="' + color + '" opacity="' + opacity + '">'];
    parts.push('<rect x="' + num(x - h * 0.016) + '" y="' + num(baseY - h * 0.16) + '" width="' + num(h * 0.032) + '" height="' + num(h * 0.16) + '"/>');
    for (var t = 0; t < tiers; t++) {
      var frac = t / tiers;
      var tw = w * (1 - frac * 0.62);
      var ty = baseY - h * 0.12 - (h * 0.82) * frac;
      var th = h * 0.42;
      parts.push('<path d="M' + num(x) + ' ' + num(ty - th) + 'L' + num(x + tw / 2) + ' ' + num(ty) + 'L' + num(x - tw / 2) + ' ' + num(ty) + 'Z"/>');
    }
    parts.push('</g>');
    return parts.join('');
  }

  function shade(hex, amt) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    function mix(v) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))); }
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }
  NM.svg.shade = shade;

  /* ================= ПЛАНИРОВКА ================= */

  NM.svg.plan = function (cfg, opts) {
    opts = opts || {};
    var model = NM.modelById(cfg.model);
    var pal = INTERIORS[cfg.interior] || INTERIORS.light;
    var terr = TERRACES[cfg.terrace] || null;

    var W = 1000, H = 430;
    var PX = 52;                        // единый масштаб для всех моделей
    var id = uid();

    /* Кегли в SVG масштабируются вместе с чертежом. В узком контейнере подписи
       становятся нечитаемыми, поэтому вызывающий код может передать компенсацию
       (см. NM.svg.renderPlanInto). Подписи, переставшие помещаться, отсеются сами. */
    var FS = opts.fontScale || 1;
    var fs = function (base) { return Math.round(base * FS); };

    var mw = model.len * PX;
    var md = model.depth * PX;
    var x0 = (W - mw) / 2;
    var y0 = 92;
    var x1 = x0 + mw, y1 = y0 + md;

    var wall = 0.28 * PX;
    var out = [];
    var defs = ['<pattern id="' + id + 'deck" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="9" height="9" fill="#E6DDCD"/><rect width="3.2" height="9" fill="#CDBB9E"/></pattern>'];

    /* --- терраса --- */
    if (terr) {
      var tw = terr.w * PX, td = terr.d * PX;
      var tx = x1 - tw - 0.2 * PX;
      out.push('<rect x="' + num(tx) + '" y="' + num(y1) + '" width="' + num(tw) + '" height="' + num(td) + '" fill="url(#' + id + 'deck)"/>');
      out.push('<rect x="' + num(tx) + '" y="' + num(y1) + '" width="' + num(tw) + '" height="' + num(td) + '" fill="none" stroke="#B0A188" stroke-width="2"/>');
      out.push('<text x="' + num(tx + tw / 2) + '" y="' + num(y1 + td / 2 + 6) + '" text-anchor="middle" font-size="' + fs(21) + '" fill="#8C7F6B" font-family="inherit">Терраса ' + terr.label + '</text>');
    }

    /* --- коробка --- */
    out.push('<rect x="' + num(x0) + '" y="' + num(y0) + '" width="' + num(mw) + '" height="' + num(md) + '" fill="' + pal.wall + '"/>');
    out.push('<rect x="' + num(x0 + wall) + '" y="' + num(y0 + wall) + '" width="' + num(mw - wall * 2) + '" height="' + num(md - wall * 2) + '" fill="' + pal.floor + '"/>');

    var ix0 = x0 + wall, iy0 = y0 + wall, ix1 = x1 - wall, iy1 = y1 - wall;
    var innerW = ix1 - ix0, innerD = iy1 - iy0;

    /* --- зоны --- */
    var zones = [];
    var cursor = ix0;

    if (cfg.purpose === 'sauna') {
      zones.push({ w: 2.4 * PX, label: 'Парная', short: 'Парная', kind: 'sauna' });
    }
    if (cfg.bathroom === 'compact') zones.push({ w: 1.55 * PX, label: 'Санузел', short: 'СУ', kind: 'bath' });
    if (cfg.bathroom === 'full') zones.push({ w: 2.2 * PX, label: 'Санузел', short: 'СУ', kind: 'bath' });

    zones.forEach(function (z) {
      out.push('<rect x="' + num(cursor) + '" y="' + num(iy0) + '" width="' + num(z.w) + '" height="' + num(innerD) + '" fill="' + shade(pal.floor, -0.07) + '"/>');
      out.push('<rect x="' + num(cursor + z.w - 3) + '" y="' + num(iy0) + '" width="3" height="' + num(innerD) + '" fill="' + pal.wall + '"/>');
      out.push(zoneFurniture(z, cursor, iy0, innerD, PX, pal));
      var zLabel = pickLabel([z.label, z.short], fs(18), z.w - 6);
      if (zLabel) {
        out.push('<text x="' + num(cursor + z.w / 2) + '" y="' + num(iy1 - 10) + '" text-anchor="middle" font-size="' + fs(18) + '" font-weight="500" fill="' + pal.label + '" font-family="inherit">' + zLabel + '</text>');
      }
      cursor += z.w;
    });

    var mainX = cursor, mainW = ix1 - cursor;

    /* --- кухня вдоль верхней стены --- */
    if (cfg.kitchen !== 'none') {
      var kw = (cfg.kitchen === 'full' ? 3.0 : 1.8) * PX;
      kw = Math.min(kw, mainW - 0.4 * PX);
      var kd = 0.62 * PX;
      var kx = ix1 - kw - 0.25 * PX;
      out.push('<rect x="' + num(kx) + '" y="' + num(iy0) + '" width="' + num(kw) + '" height="' + num(kd) + '" fill="' + pal.furn + '" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      out.push('<circle cx="' + num(kx + kw * 0.22) + '" cy="' + num(iy0 + kd / 2) + '" r="' + num(0.19 * PX) + '" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      out.push('<rect x="' + num(kx + kw * 0.48) + '" y="' + num(iy0 + kd * 0.2) + '" width="' + num(kw * 0.3) + '" height="' + num(kd * 0.6) + '" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      var kLabel = pickLabel(['Кухня ' + (cfg.kitchen === 'full' ? '3 м' : '1,8 м'), 'Кухня'], fs(17), kw);
      if (kLabel) {
        out.push('<text x="' + num(kx + kw / 2) + '" y="' + num(iy0 + kd + 19) + '" text-anchor="middle" font-size="' + fs(17) + '" fill="' + pal.label + '" font-family="inherit" opacity="0.8">' + kLabel + '</text>');
      }
    }

    /* --- мебель основной зоны ---
       Длинные пояснения намеренно не рисуем в SVG: при сжатии до ширины карточки
       такой текст превращается в нечитаемое пятно. Подписи выводит HTML — см. NM.svg.planCaption. */
    /* --- отопление: змеевик тёплого пола под мебелью, конвекторы у наружной стены --- */
    if (cfg.heating === 'floor' || cfg.heating === 'both') {
      var loop = '', step = 0.32 * PX, ly0 = iy0 + 0.75 * PX, ly1 = iy1 - 0.3 * PX;
      for (var lx = mainX + 0.3 * PX, dir = 0; lx < ix1 - 0.3 * PX; lx += step, dir++) {
        loop += (loop ? 'L' : 'M') + num(lx) + ' ' + num(dir % 2 ? ly1 : ly0) + 'L' + num(lx) + ' ' + num(dir % 2 ? ly0 : ly1);
      }
      out.push('<path class="nm-heat" d="' + loop + '" fill="none" stroke="#E8743B" stroke-width="2" stroke-dasharray="6 5" opacity=".55"/>');
    }
    if (cfg.heating === 'convectors' || cfg.heating === 'both') {
      for (var cx = mainX + 0.5 * PX; cx < ix1 - 2.2 * PX; cx += 2.6 * PX) {
        out.push('<rect x="' + num(cx) + '" y="' + num(iy1 - 0.2 * PX) + '" width="' + num(1.0 * PX) + '" height="' + num(0.16 * PX) + '" rx="2" fill="#E8743B" opacity=".85"/>');
      }
    }

    var furnOpacity = cfg.furniture === 'none' ? 0.28 : 1;
    out.push('<g opacity="' + furnOpacity + '">' + mainFurniture(cfg, mainX, iy0, mainW, innerD, PX, pal, fs) + '</g>');

    /* --- окна на нижней стене --- */
    var winY = y1 - wall;
    if (cfg.glazing === 'panoramic') {
      out.push('<rect x="' + num(mainX + 0.2 * PX) + '" y="' + num(winY) + '" width="' + num(Math.max(60, mainW - 2.3 * PX)) + '" height="' + num(wall) + '" fill="#9FC4D6"/>');
    } else {
      var wwid = (cfg.glazing === 'large' ? 2.0 : 1.2) * PX;
      var slots = mainW > 5 * PX ? 2 : 1;
      for (var q = 0; q < slots; q++) {
        var wxp = mainX + 0.35 * PX + q * (wwid + 0.7 * PX);
        if (wxp + wwid > ix1 - 2.0 * PX) break;
        out.push('<rect x="' + num(wxp) + '" y="' + num(winY) + '" width="' + num(wwid) + '" height="' + num(wall) + '" fill="#9FC4D6"/>');
      }
    }

    /* --- дверь --- */
    var doorW = 1.0 * PX;
    var doorX = x1 - 1.75 * PX;
    out.push('<rect x="' + num(doorX) + '" y="' + num(winY) + '" width="' + num(doorW) + '" height="' + num(wall) + '" fill="' + pal.floor + '"/>');
    out.push('<path d="M' + num(doorX) + ' ' + num(winY) + 'A' + num(doorW) + ' ' + num(doorW) + ' 0 0 1 ' + num(doorX + doorW) + ' ' + num(winY - doorW) + '" fill="none" stroke="' + pal.label + '" stroke-width="1.5" opacity="0.5"/>');
    out.push('<rect x="' + num(doorX) + '" y="' + num(winY - doorW) + '" width="3" height="' + num(doorW) + '" fill="' + pal.label + '" opacity="0.6"/>');

    /* --- человек сверху для масштаба --- */
    var hx = mainX + mainW * 0.3, hy = iy0 + innerD * 0.52;
    out.push('<g opacity="0.85">' +
      '<ellipse cx="' + num(hx) + '" cy="' + num(hy) + '" rx="' + num(0.26 * PX) + '" ry="' + num(0.19 * PX) + '" fill="' + pal.accent + '" opacity="0.28"/>' +
      '<circle cx="' + num(hx) + '" cy="' + num(hy) + '" r="' + num(0.11 * PX) + '" fill="' + pal.accent + '"/></g>');

    /* --- размерные линии --- */
    var dimY = y0 - 30;
    out.push(dimLineH(x0, x1, dimY, model.len.toFixed(1).replace('.', ',') + ' м', fs));
    out.push(dimLineV(x1 + 34, y0, y1, model.depth.toFixed(1).replace('.', ',') + ' м', fs));

    /* Плотная обрезка для карточек: в едином масштабе NORD S занимает лишь треть кадра,
       и вместе с ним ужимается весь текст. Там, где важно сравнение моделей
       (секция «Реальные размеры» и конфигуратор), кадр остаётся полным. */
    var vb = '0 0 ' + W + ' ' + H;
    if (opts.tight) {
      /* Правое поле должно вместить вертикальную размерную линию с подписью, иначе она срежется */
      var padL = 26, padR = 60 + fs(21) * 4.4, padT = 30 + fs(21) * 1.4, padB = 30;
      var bx = x0 - padL;
      var bw = (x1 - x0) + padL + padR;
      var by = y0 - padT;
      var bh = (y1 - y0) + (terr ? terr.d * PX : 0) + padT + padB;
      vb = num(bx) + ' ' + num(by) + ' ' + num(bw) + ' ' + num(bh);
    }

    return '<svg class="nm-svg" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="Планировка ' + model.name + '">' +
      '<defs>' + defs.join('') + '</defs>' + out.join('') + '</svg>';
  };

  /* Кегли внутри SVG масштабируются вместе с чертежом, поэтому в узком контейнере
     подписи становятся нечитаемыми. Рисуем в два прохода: вставляем, замеряем
     фактический масштаб и, если нужно, перерисовываем с компенсацией.
     Подписи, переставшие помещаться после увеличения, отсеются сами. */
  NM.svg.renderInto = function (el, draw, opts) {
    opts = opts || {};
    el.innerHTML = draw(opts);

    var svg = el.querySelector('svg');
    if (!svg) return;
    var vb = (svg.getAttribute('viewBox') || '').split(' ').map(Number);
    var rendered = svg.getBoundingClientRect().width;
    if (!vb[2] || !rendered) return;

    var k = rendered / vb[2];
    if (k < 0.85) {
      el.innerHTML = draw(Object.assign({}, opts, { fontScale: Math.min(2.8, 0.85 / k) }));
    }
  };

  NM.svg.renderPlanInto = function (el, cfg, opts) {
    NM.svg.renderInto(el, function (o) { return NM.svg.plan(cfg, o); }, opts);
  };

  /* Подпись к планировке — выводится обычным HTML, чтобы оставаться читаемой при любом размере блока */
  NM.svg.planCaption = function (cfg) {
    var model = NM.modelById(cfg.model);
    return model.name + ' · ' + model.area + ' м² · план в масштабе, силуэт человека для сравнения' +
      (cfg.furniture === 'none' ? '. Мебель показана бледным — как возможная расстановка, в цену не входит' : '');
  };

  function zoneFurniture(z, x, y, d, PX, pal) {
    var s = [];
    if (z.kind === 'sauna') {
      s.push('<rect x="' + num(x + 0.15 * PX) + '" y="' + num(y + 0.15 * PX) + '" width="' + num(z.w - 0.3 * PX) + '" height="' + num(0.55 * PX) + '" fill="' + pal.furn + '" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      s.push('<rect x="' + num(x + 0.15 * PX) + '" y="' + num(y + d - 0.7 * PX) + '" width="' + num(z.w - 0.3 * PX) + '" height="' + num(0.55 * PX) + '" fill="' + pal.furn + '" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      s.push('<rect x="' + num(x + 0.2 * PX) + '" y="' + num(y + d / 2 - 0.28 * PX) + '" width="' + num(0.55 * PX) + '" height="' + num(0.55 * PX) + '" fill="#8C4A2C" rx="3"/>');
    } else if (z.kind === 'bath') {
      var big = z.w > 2 * PX;
      s.push('<rect x="' + num(x + 0.18 * PX) + '" y="' + num(y + 0.18 * PX) + '" width="' + num((big ? 0.9 : 0.8) * PX) + '" height="' + num((big ? 0.9 : 0.8) * PX) + '" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      s.push('<path d="M' + num(x + 0.18 * PX) + ' ' + num(y + 0.18 * PX) + 'l' + num((big ? 0.9 : 0.8) * PX) + ' ' + num((big ? 0.9 : 0.8) * PX) + '" stroke="' + pal.furnLine + '" stroke-width="1.5" opacity="0.6"/>');
      s.push('<ellipse cx="' + num(x + z.w / 2) + '" cy="' + num(y + d * 0.58) + '" rx="' + num(0.22 * PX) + '" ry="' + num(0.17 * PX) + '" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      s.push('<rect x="' + num(x + z.w - 0.62 * PX) + '" y="' + num(y + d * 0.66) + '" width="' + num(0.38 * PX) + '" height="' + num(0.52 * PX) + '" rx="6" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
    }
    return s.join('');
  }

  function mainFurniture(cfg, x, y, w, d, PX, pal, fs) {
    var s = [];
    function rect(rx, ry, rw, rh, label, short) {
      s.push('<rect x="' + num(rx) + '" y="' + num(ry) + '" width="' + num(rw) + '" height="' + num(rh) + '" fill="' + pal.furn + '" stroke="' + pal.furnLine + '" stroke-width="2" rx="3"/>');
      var text = pickLabel([label, short], fs(16), rw - 4);
      if (text && rh > 22) {
        s.push('<text x="' + num(rx + rw / 2) + '" y="' + num(ry + rh / 2 + 5) + '" text-anchor="middle" font-size="' + fs(16) + '" fill="' + pal.label + '" font-family="inherit" opacity="0.85">' + text + '</text>');
      }
    }
    var p = cfg.purpose;
    var pad = 0.3 * PX;

    if (p === 'office') {
      rect(x + pad, y + pad, 1.6 * PX, 0.7 * PX, 'стол 160', 'стол');
      s.push('<circle cx="' + num(x + pad + 0.8 * PX) + '" cy="' + num(y + pad + 1.1 * PX) + '" r="' + num(0.24 * PX) + '" fill="none" stroke="' + pal.furnLine + '" stroke-width="2"/>');
      if (w > 3.4 * PX) rect(x + w - pad - 1.2 * PX, y + d - pad - 0.45 * PX, 1.2 * PX, 0.45 * PX, 'хранение', null);
      /* Порог поднят: в шестиметровом модуле диван налезал на дверной проём */
      if (w > 6.6 * PX) rect(x + w * 0.42, y + d - pad - 0.85 * PX, 1.8 * PX, 0.85 * PX, 'диван', null);
    } else if (p === 'sauna') {
      rect(x + pad, y + pad, 1.6 * PX, 0.6 * PX, 'лавка', null);
      if (w > 3 * PX) rect(x + w - pad - 1.0 * PX, y + pad, 1.0 * PX, 0.9 * PX, 'стол', null);
    } else {
      rect(x + pad, y + d - pad - 2.0 * PX, 1.6 * PX, 2.0 * PX, 'кровать 160×200', 'кровать');
      if (w > 4.2 * PX) rect(x + w * 0.42, y + pad + 0.9 * PX, 1.8 * PX, 0.8 * PX, 'диван', null);
      if (w > 5.6 * PX) rect(x + w - pad - 0.6 * PX, y + d - pad - 1.4 * PX, 0.6 * PX, 1.4 * PX, null, null);
    }
    return s.join('');
  }

  function dimLineH(x0, x1, y, label, fs) {
    return '<g stroke="rgba(30,33,36,0.4)" stroke-width="1.4" fill="none">' +
      '<path d="M' + num(x0) + ' ' + num(y - 6) + 'V' + num(y + 6) + 'M' + num(x1) + ' ' + num(y - 6) + 'V' + num(y + 6) + 'M' + num(x0) + ' ' + num(y) + 'H' + num(x1) + '"/></g>' +
      '<rect x="' + num((x0 + x1) / 2 - 42) + '" y="' + num(y - 13) + '" width="' + num(fs(21) * 4.2) + '" height="' + fs(26) + '" fill="#FAFAF8"/>' +
      '<text x="' + num((x0 + x1) / 2) + '" y="' + num(y + 6) + '" text-anchor="middle" font-size="' + fs(21) + '" font-weight="500" fill="rgba(30,33,36,0.75)" font-family="inherit">' + label + '</text>';
  }

  function dimLineV(x, y0, y1, label, fs) {
    return '<g stroke="rgba(30,33,36,0.4)" stroke-width="1.4" fill="none">' +
      '<path d="M' + num(x - 6) + ' ' + num(y0) + 'H' + num(x + 6) + 'M' + num(x - 6) + ' ' + num(y1) + 'H' + num(x + 6) + 'M' + num(x) + ' ' + num(y0) + 'V' + num(y1) + '"/></g>' +
      '<text x="' + num(x + 12) + '" y="' + num((y0 + y1) / 2 + 6) + '" font-size="' + fs(21) + '" font-weight="500" fill="rgba(30,33,36,0.75)" font-family="inherit">' + label + '</text>';
  }

  /* ================= СРАВНЕНИЕ РАЗМЕРОВ ================= */

  NM.svg.compare = function (modelId, opts) {
    opts = opts || {};
    var fs = function (b) { return Math.round(b * (opts.fontScale || 1)); };
    var model = NM.modelById(modelId);
    var W = 1000, PX = 44, x0 = 30;
    var out = [];
    var ink = '#1E2124', line = '#6D7478', faint = '#9BA3A7', accent = '#C56B3E';
    var meters = function (v) { return String(v).replace('.', ','); };

    /* Пятно модуля поверх парковочной сетки — главный ориентир по площади */
    var mw = model.len * PX, md = model.depth * PX;
    var y0 = 28 + fs(17) + 14;
    var parkLabel = pickLabel(['пунктиром — парковочное место 5,3 × 2,5 м', 'пунктиром — парковочное место', 'парковка'], fs(17), W - x0 * 2);
    if (parkLabel) out.push('<text x="' + x0 + '" y="' + (y0 - 14) + '" font-size="' + fs(17) + '" fill="' + faint + '" font-family="inherit">' + parkLabel + '</text>');
    var park = { w: 5.3 * PX, d: 2.5 * PX };
    var cols = Math.max(1, Math.ceil(model.len / 5.3)), rows = Math.max(1, Math.ceil(model.depth / 2.5));
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      out.push('<rect x="' + num(x0 + c * park.w) + '" y="' + num(y0 + r * park.d) + '" width="' + num(park.w) + '" height="' + num(park.d) + '" fill="none" stroke="' + faint + '" stroke-width="1.2" stroke-dasharray="6 5"/>');
    }
    out.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + num(mw) + '" height="' + num(md) + '" fill="rgba(197,107,62,.12)" stroke="' + accent + '" stroke-width="2.5"/>');
    var cmpLabel = pickLabel([model.name + ' · ' + model.area + ' м²', model.area + ' м²'], fs(21), mw - 10);
    if (cmpLabel) out.push('<text x="' + num(x0 + mw / 2) + '" y="' + num(y0 + md / 2 + fs(21) * 0.35) + '" text-anchor="middle" font-size="' + fs(21) + '" font-weight="600" fill="' + accent + '" font-family="inherit">' + cmpLabel + '</text>');

    /* размерная линия длины модуля */
    var dimY = y0 + Math.max(md, rows * park.d) + 18;
    out.push('<path d="M' + x0 + ' ' + (dimY - 6) + 'v12M' + num(x0 + mw) + ' ' + (dimY - 6) + 'v12M' + x0 + ' ' + dimY + 'H' + num(x0 + mw) + '" stroke="' + line + '" stroke-width="1"/>');
    out.push('<text x="' + num(x0 + mw / 2) + '" y="' + (dimY + fs(15) + 4) + '" text-anchor="middle" font-size="' + fs(15) + '" fill="' + line + '" font-family="inherit">' + meters(model.len.toFixed(1)) + ' м</text>');

    /* Привычные предметы в том же масштабе — вид сверху, как на плане */
    var items = [
      { w: 4.6, d: 1.8, label: 'Автомобиль', draw: car },
      { w: 2.0, d: 1.6, label: 'Кровать 160 × 200', draw: bed },
      { w: 1.4, d: 0.8, label: 'Стол на 4 персоны', draw: table },
      { w: 0.8, d: 0.8, label: 'Кресло', draw: chair }
    ];
    var ox = x0, rowTop = dimY + fs(15) + 30 + fs(17) + 12, rowH = 0, gap = 36;
    out.push('<text x="' + x0 + '" y="' + (rowTop - 14) + '" font-size="' + fs(17) + '" fill="' + faint + '" font-family="inherit">в том же масштабе, вид сверху:</text>');
    items.forEach(function (it) {
      var w = it.w * PX, d = it.d * PX;
      var slot = Math.max(w, textWidth(it.label, fs(16)), textWidth('0,0 × 0,0 м', fs(14)));
      if (ox + slot > W - x0 && ox > x0) { ox = x0; rowTop += rowH + gap; rowH = 0; }
      out.push(it.draw(ox, rowTop, w, d));
      var ty = rowTop + d + fs(16) + 12;
      out.push('<text x="' + num(ox) + '" y="' + num(ty) + '" font-size="' + fs(16) + '" fill="' + ink + '" font-family="inherit">' + it.label + '</text>');
      out.push('<text x="' + num(ox) + '" y="' + num(ty + fs(14) + 4) + '" font-size="' + fs(14) + '" fill="' + faint + '" font-family="inherit">' + meters(it.w) + ' × ' + meters(it.d) + ' м</text>');
      rowH = Math.max(rowH, d + fs(16) + fs(14) + 20);
      ox += slot + gap;
    });

    /* масштабная линейка */
    var barY = rowTop + rowH + 30;
    for (var m = 0; m < 5; m++) out.push('<rect x="' + (x0 + m * PX) + '" y="' + barY + '" width="' + PX + '" height="6" fill="' + (m % 2 ? '#fff' : ink) + '" stroke="' + ink + '" stroke-width="1"/>');
    out.push('<text x="' + x0 + '" y="' + (barY + 10 + fs(13)) + '" font-size="' + fs(13) + '" fill="' + line + '" font-family="inherit">0</text>');
    out.push('<text x="' + (x0 + 5 * PX) + '" y="' + (barY + 10 + fs(13)) + '" text-anchor="middle" font-size="' + fs(13) + '" fill="' + line + '" font-family="inherit">5 м</text>');
    var H = Math.ceil(barY + 10 + fs(13) + 12);

    function car(x, y, w, d) {
      return '<g fill="none" stroke="' + line + '" stroke-width="1.4">' +
        '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(d) + '" rx="' + num(d * 0.32) + '" fill="#ECEEEB"/>' +
        '<rect x="' + num(x + w * 0.3) + '" y="' + num(y + d * 0.12) + '" width="' + num(w * 0.42) + '" height="' + num(d * 0.76) + '" rx="5"/>' +
        '<path d="M' + num(x + w * 0.3) + ' ' + num(y + d * 0.2) + 'L' + num(x + w * 0.22) + ' ' + num(y + d * 0.12) + 'M' + num(x + w * 0.3) + ' ' + num(y + d * 0.8) + 'L' + num(x + w * 0.22) + ' ' + num(y + d * 0.88) + '"/>' +
      '</g>';
    }
    function bed(x, y, w, d) {
      return '<g fill="none" stroke="' + line + '" stroke-width="1.4">' +
        '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(d) + '" rx="3" fill="#ECEEEB"/>' +
        '<rect x="' + num(x + 4) + '" y="' + num(y + 4) + '" width="' + num(w * 0.18) + '" height="' + num(d / 2 - 6) + '" rx="3"/>' +
        '<rect x="' + num(x + 4) + '" y="' + num(y + d / 2 + 2) + '" width="' + num(w * 0.18) + '" height="' + num(d / 2 - 6) + '" rx="3"/>' +
        '<path d="M' + num(x + w * 0.34) + ' ' + num(y) + 'V' + num(y + d) + '"/>' +
      '</g>';
    }
    function table(x, y, w, d) {
      var cw = PX * 0.3, ch = PX * 0.22;
      return '<g fill="none" stroke="' + line + '" stroke-width="1.4">' +
        '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(d) + '" rx="2" fill="#ECEEEB"/>' +
        [0.15, 0.6].map(function (k) {
          return '<rect x="' + num(x + w * k) + '" y="' + num(y - ch - 3) + '" width="' + cw + '" height="' + ch + '" rx="2"/>' +
            '<rect x="' + num(x + w * k) + '" y="' + num(y + d + 3) + '" width="' + cw + '" height="' + ch + '" rx="2"/>';
        }).join('') +
      '</g>';
    }
    function chair(x, y, w, d) {
      return '<g fill="none" stroke="' + line + '" stroke-width="1.4">' +
        '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(d) + '" rx="5" fill="#ECEEEB"/>' +
        '<path d="M' + num(x + 3) + ' ' + num(y + d * 0.3) + 'H' + num(x + w - 3) + '"/>' +
      '</g>';
    }

    return '<svg class="nm-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" ' +
      'role="img" aria-label="Сравнение размеров ' + model.name + ' с автомобилем, кроватью и столом">' + out.join('') + '</svg>';
  };

  /* ================= ФАСАДНЫЙ ЧЕРТЁЖ ================= */

  /* Главный фасад в едином масштабе для всех моделей. Перестраивается от каждой опции конфигуратора:
     модель, обшивка, остекление, терраса и навес, интерьер (свет в окнах), фундамент. Узлы, которые
     изменились с прошлой отрисовки, проявляются с анимацией. */
  var GLOW = { light: ['#FFD9A0', '#F2B567'], white: ['#FFF0D2', '#F5D3A0'], graphite: ['#F6C27E', '#C98B45'] };
  var facadeSeen = {};

  NM.svg.facade = function (cfg, opts) {
    opts = opts || {};
    var fs = function (b) { return Math.round(b * (opts.fontScale || 1)); };
    var model = NM.modelById(cfg.model);
    var fac = FACADES[cfg.facade] || FACADES.planken;
    var glow = GLOW[cfg.interior] || GLOW.light;
    var terr = TERRACES[cfg.terrace] || null;
    var id = uid();
    var W = 1000, H = 520, PX = 50, ground = 410;
    var fh = (FOUNDATIONS[cfg.foundation] || 0.4) * PX;
    var len = model.len * PX, h = model.height * PX;
    var tw = terr ? terr.w * PX : 0;
    var x0 = Math.round((W - len - tw) / 2);
    var x1 = x0 + len;
    var floor = ground - fh, top = floor - h;
    var out = [];
    var keyOf = function (k) { var fresh = !facadeSeen[k]; facadeSeen[k] = true; return fresh ? ' fx-new' : ''; };

    out.push('<defs>' +
      '<pattern id="' + id + 'grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#E3E1DA" stroke-width="1"/></pattern>' +
      '<linearGradient id="' + id + 'glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + glow[0] + '"/><stop offset="1" stop-color="' + glow[1] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity=".35"/><stop offset="0.62" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="' + id + 'body"><rect x="' + x0 + '" y="' + top + '" width="' + len + '" height="' + h + '"/></clipPath>' +
      '</defs>');
    out.push('<rect width="' + W + '" height="' + H + '" fill="#F7F6F2"/><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'grid)"/>');

    /* Земля, тень, трава */
    out.push('<ellipse cx="' + ((x0 + x1 + tw) / 2) + '" cy="' + (ground + 6) + '" rx="' + ((len + tw) / 2 + 30) + '" ry="10" fill="#1E2124" opacity=".08"/>');
    out.push('<path d="M40 ' + ground + 'H' + (W - 40) + '" stroke="#1E2124" stroke-width="2"/>');
    var grass = '';
    for (var g = 50; g < W - 50; g += 17) grass += 'M' + g + ' ' + (ground + 4) + 'l6 9';
    out.push('<path d="' + grass + '" stroke="#9BA3A7" stroke-width="1"/>');

    /* Фундамент */
    var base = '';
    if (cfg.foundation === 'blocks') {
      for (var b = x0 + 10; b < x1 - 20; b += 2.4 * PX) base += '<rect x="' + b + '" y="' + floor + '" width="' + (0.4 * PX) + '" height="' + fh + '" fill="#A9AFB1" stroke="#6D7478"/>';
      base += '<rect x="' + (x1 - 0.4 * PX - 10) + '" y="' + floor + '" width="' + (0.4 * PX) + '" height="' + fh + '" fill="#A9AFB1" stroke="#6D7478"/>';
    } else if (cfg.foundation === 'own') {
      base += '<rect x="' + (x0 - 8) + '" y="' + floor + '" width="' + (len + 16) + '" height="' + fh + '" fill="#B9BEC0" stroke="#6D7478"/>';
    } else {
      for (var s = x0 + 12; s < x1; s += 2 * PX) base += '<path d="M' + s + ' ' + floor + 'V' + (ground + 16) + '" stroke="#6D7478" stroke-width="5"/><path d="M' + (s - 6) + ' ' + (ground + 14) + 'h12" stroke="#6D7478" stroke-width="2"/>';
      base += '<path d="M' + (x1 - 12) + ' ' + floor + 'V' + (ground + 16) + '" stroke="#6D7478" stroke-width="5"/>';
    }
    out.push('<g class="fx' + keyOf('base' + cfg.foundation + cfg.model) + '">' + base + '</g>');

    /* Корпус и обшивка */
    var clad = '<rect x="' + x0 + '" y="' + top + '" width="' + len + '" height="' + h + '" fill="' + fac.wall + '"/>';
    var lines = '';
    var pitch = fac.pitch * PX;
    if (fac.dir === 'h') {
      for (var y = top + pitch, i = 0; y < floor; y += pitch, i++) lines += '<path d="M' + x0 + ' ' + y.toFixed(1) + 'H' + x1 + '" stroke="' + fac.line + '" stroke-width="' + (i % 3 ? 1 : 1.6) + '" opacity="' + (i % 2 ? 0.75 : 1) + '"/>';
    } else if (fac.dir === 'v') {
      for (var x = x0 + pitch, j = 0; x < x1; x += pitch, j++) lines += '<path d="M' + x.toFixed(1) + ' ' + top + 'V' + floor + '" stroke="' + fac.line + '" stroke-width="' + (j % 2 ? 1 : 1.8) + '"/>';
    } else {
      for (var gx = x0 + pitch; gx < x1; gx += pitch) lines += '<path d="M' + gx.toFixed(1) + ' ' + top + 'V' + floor + '" stroke="' + fac.line + '" stroke-width="2"/>';
      lines += '<path d="M' + x0 + ' ' + (top + h / 2) + 'H' + x1 + '" stroke="' + fac.line + '" stroke-width="2"/>';
      for (var dx = x0 + pitch / 2; dx < x1; dx += pitch) lines += '<circle cx="' + dx.toFixed(1) + '" cy="' + (top + 8) + '" r="1.4" fill="' + fac.line + '"/><circle cx="' + dx.toFixed(1) + '" cy="' + (floor - 8) + '" r="1.4" fill="' + fac.line + '"/>';
    }
    if (fac.accent) {
      var ax = x1 - 2.2 * PX;
      lines += '<rect x="' + ax + '" y="' + top + '" width="' + (2.2 * PX) + '" height="' + h + '" fill="' + fac.accent + '"/>';
      for (var ay = top + 0.19 * PX; ay < floor; ay += 0.19 * PX) lines += '<path d="M' + ax + ' ' + ay.toFixed(1) + 'H' + x1 + '" stroke="#8A5A2F" stroke-width="1"/>';
    }
    out.push('<g class="fx' + keyOf('clad' + cfg.facade + cfg.model) + '" clip-path="url(#' + id + 'body)">' + clad + lines + '</g>');
    out.push('<rect x="' + x0 + '" y="' + top + '" width="' + len + '" height="' + h + '" fill="none" stroke="#1E2124" stroke-width="2.5"/>');

    /* Кровля: тонкая плита с парапетом, навес над террасой продлевает её */
    var roofRight = x1 + (terr && terr.canopy ? tw : 0) + 10;
    out.push('<g class="fx' + keyOf('roof' + cfg.terrace + cfg.model) + '"><rect x="' + (x0 - 12) + '" y="' + (top - 16) + '" width="' + (roofRight - x0 + 12) + '" height="16" fill="' + fac.roof + '"/>' +
      '<path d="M' + (x0 - 12) + ' ' + (top - 16) + 'H' + roofRight + '" stroke="#5F676B" stroke-width="2"/></g>');

    /* Окна и дверь. Остекление задаёт размер окон, интерьер — цвет света */
    var glass = function (x, y, w, gh, mullions) {
      var m = '';
      for (var k = 1; k < mullions; k++) m += '<path d="M' + (x + (w * k) / mullions).toFixed(1) + ' ' + y + 'V' + (y + gh) + '" stroke="' + fac.trim + '" stroke-width="3"/>';
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + gh + '" fill="url(#' + id + 'glow)"/>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + gh + '" fill="url(#' + id + 'sheen)"/>' + m +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + gh + '" fill="none" stroke="' + fac.trim + '" stroke-width="4"/>' +
        '<path d="M' + (x - 4) + ' ' + (y + gh + 3) + 'h' + (w + 8) + '" stroke="#1E2124" stroke-width="3"/>';
    };
    var win = '';
    var doorW = 0.95 * PX, doorH = 2.15 * PX, doorX = x1 - doorW - 0.5 * PX - (fac.accent ? 0.6 * PX : 0);
    var span = doorX - x0 - 0.6 * PX;
    if (cfg.glazing === 'panoramic') {
      var pw = span - 0.3 * PX;
      win += glass(x0 + 0.5 * PX, top + 0.25 * PX, pw, h - 0.25 * PX - 6, Math.max(2, Math.round(pw / (1.2 * PX))));
    } else {
      var ww = (cfg.glazing === 'large' ? 2.0 : 1.2) * PX, wh = (cfg.glazing === 'large' ? 1.8 : 1.4) * PX;
      var count = Math.max(1, Math.min(3, Math.floor(span / (ww + 0.8 * PX))));
      var gap = (span - count * ww) / (count + 1);
      for (var n = 0; n < count; n++) win += glass(x0 + 0.3 * PX + gap + n * (ww + gap), floor - 0.9 * PX - wh, ww, wh, cfg.glazing === 'large' ? 2 : 1);
    }
    win += '<rect x="' + doorX + '" y="' + (floor - doorH) + '" width="' + doorW + '" height="' + doorH + '" fill="' + fac.trim + '" stroke="#1E2124" stroke-width="2"/>' +
      '<rect x="' + (doorX + 8) + '" y="' + (floor - doorH + 10) + '" width="' + (doorW * 0.32) + '" height="' + (doorH - 24) + '" fill="url(#' + id + 'glow)" opacity=".9"/>' +
      '<path d="M' + (doorX + doorW - 9) + ' ' + (floor - doorH / 2 - 10) + 'v20" stroke="#D9D6D0" stroke-width="3" stroke-linecap="round"/>';
    out.push('<g class="fx' + keyOf('glass' + cfg.glazing + cfg.interior + cfg.model + cfg.facade) + '">' + win + '</g>');

    /* Терраса: настил, ступени, ограждение; навес — на двух стойках */
    if (terr) {
      var tx = x1, deckY = floor;
      var deck = '<rect x="' + tx + '" y="' + deckY + '" width="' + tw + '" height="8" fill="#A97240" stroke="#7A4E29" stroke-width="1.5"/>';
      for (var p = tx + 10; p < tx + tw - 4; p += 1.6 * PX) deck += '<path d="M' + p + ' ' + (deckY + 8) + 'V' + (ground + 12) + '" stroke="#6D7478" stroke-width="4"/>';
      var stepH = (ground - deckY - 8) / 2;
      deck += '<path d="M' + (tx + tw) + ' ' + (deckY + 8) + 'h14v' + stepH.toFixed(1) + 'h14v' + stepH.toFixed(1) + '" fill="none" stroke="#7A4E29" stroke-width="3"/>';
      if (cfg.terrace === 'open_l' || cfg.terrace === 'canopy_l') {
        deck += '<path d="M' + tx + ' ' + (deckY - 0.95 * PX) + 'H' + (tx + tw - 6) + 'M' + (tx + tw - 6) + ' ' + (deckY - 0.95 * PX) + 'V' + deckY + '" stroke="#1E2124" stroke-width="2.5"/>';
        for (var r = tx + 14; r < tx + tw - 8; r += 14) deck += '<path d="M' + r + ' ' + (deckY - 0.95 * PX) + 'V' + deckY + '" stroke="#1E2124" stroke-width="1"/>';
      }
      if (terr.canopy) deck += '<path d="M' + (tx + tw - 4) + ' ' + (top) + 'V' + deckY + '" stroke="#1E2124" stroke-width="5"/><path d="M' + (tx + tw * 0.45) + ' ' + top + 'V' + deckY + '" stroke="#1E2124" stroke-width="5"/>';
      // уличная мебель — стол и два кресла
      var fx = tx + tw * 0.5;
      deck += '<path d="M' + (fx - 22) + ' ' + (deckY - 0.75 * PX) + 'h44M' + (fx - 16) + ' ' + (deckY - 0.75 * PX) + 'V' + deckY + 'M' + (fx + 16) + ' ' + (deckY - 0.75 * PX) + 'V' + deckY + '" stroke="#4A4235" stroke-width="3"/>';
      out.push('<g class="fx' + keyOf('terr' + cfg.terrace + cfg.model) + '">' + deck + '</g>');
    }

    /* Человек для масштаба у входа */
    var hh = 1.8 * PX, hx = (terr ? x1 + tw + 40 : x1 + 30);
    out.push('<path d="' + HUMAN_PATH.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, function (m0, a, c) { return (hx + parseFloat(a) * hh).toFixed(1) + ',' + (ground - hh + parseFloat(c) * hh).toFixed(1); }) + '" fill="#1E2124" opacity=".82"/>');
    out.push('<circle cx="' + (hx + 0.21 * hh).toFixed(1) + '" cy="' + (ground - hh + 0.09 * hh).toFixed(1) + '" r="' + (0.085 * hh).toFixed(1) + '" fill="#1E2124" opacity=".82"/>');

    /* Размеры */
    var dimY = ground + 52;
    var dim = function (xa, xb, y, label) {
      return '<path d="M' + xa + ' ' + (y - 8) + 'v16M' + xb + ' ' + (y - 8) + 'v16M' + xa + ' ' + y + 'H' + xb + '" stroke="#6D7478" stroke-width="1.3"/>' +
        '<path d="M' + (xa - 5) + ' ' + (y + 5) + 'l10 -10M' + (xb - 5) + ' ' + (y + 5) + 'l10 -10" stroke="#6D7478" stroke-width="1.3"/>' +
        '<text x="' + ((xa + xb) / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-size="' + fs(17) + '" fill="#3A4145" font-family="inherit">' + label + '</text>';
    };
    out.push(dim(x0, x1, dimY, model.len.toFixed(1).replace('.', ',') + ' м'));
    if (terr) out.push(dim(x1, x1 + tw, dimY, 'терраса ' + terr.label));
    out.push('<path d="M' + (x0 - 40) + ' ' + top + 'v' + (floor - top) + 'M' + (x0 - 48) + ' ' + top + 'h16M' + (x0 - 48) + ' ' + floor + 'h16" stroke="#6D7478" stroke-width="1.3"/>' +
      '<text x="' + (x0 - 52) + '" y="' + ((top + floor) / 2) + '" text-anchor="end" font-size="' + fs(17) + '" fill="#3A4145" font-family="inherit">' + model.height.toFixed(1).replace('.', ',') + ' м</text>');

    /* Подпись сборки */
    var option = function (step, value) {
      var list = (NM.stepById(step) || {}).options;
      return Array.isArray(list) ? list.filter(function (o) { return o.id === value; })[0] : null;
    };
    var facadeTitle = option('facade', cfg.facade);
    var glazingTitle = option('glazing', cfg.glazing);
    var caption = [model.name + ' «' + model.sub + '»', facadeTitle && facadeTitle.title, glazingTitle && glazingTitle.title.toLowerCase() + ' остекление', terr ? (terr.canopy ? 'терраса с навесом ' : 'терраса ') + terr.label : 'без террасы'].filter(Boolean).join(' · ');
    var cap = pickLabel([caption, model.name + ' · ' + (facadeTitle ? facadeTitle.title : ''), model.name], fs(19), W - 80);
    /* Кадр по содержимому: модуль крупно, без пустых полей */
    var vx = Math.max(0, x0 - 130), vr = Math.min(W, Math.max(x1 + tw + 70, hx + 0.5 * hh + 50));
    var vy = Math.max(0, top - 16 - 40 - fs(19) * 2 - 14), vb = dimY + 22;
    if (cap) out.push('<text x="' + (vx + 24) + '" y="' + (vy + 10 + fs(19)) + '" font-size="' + fs(19) + '" font-weight="600" fill="#1E2124" font-family="inherit">' + cap + '</text>');
    out.push('<text x="' + (vx + 24) + '" y="' + (vy + 18 + fs(19) + fs(14)) + '" font-size="' + fs(14) + '" fill="#9BA3A7" font-family="inherit" letter-spacing=".08em">ГЛАВНЫЙ ФАСАД · М 1:50</text>');

    return '<svg class="nm-svg facade-svg" viewBox="' + vx + ' ' + vy + ' ' + (vr - vx) + ' ' + (vb - vy) + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Фасад: ' + caption + '">' + out.join('') + '</svg>';
  };

  /* ================= РАЗРЕЗ СТЕНЫ ================= */

  NM.svg.wall = function (activeIndex, opts) {
    opts = opts || {};
    var fs = function (b) { return Math.round(b * (opts.fontScale || 1)); };
    var layers = NM.WALL_LAYERS;
    var weights = [1.1, 1.6, 0.5, 7.2, 0.5, 1.5];
    var W = 1000;
    var top = fs(24) + 22, labelY = top + 170 + fs(24) + 10, ruleY = labelY + 14, totalY = ruleY + fs(24) + 10, H = totalY + 14;
    var totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
    var pad = 40;
    var usable = W - pad * 2;
    var colors = ['#A97240', '#3E5C50', '#7FA0B0', '#D9CBAE', '#C6A15B', '#E8E4DA'];
    var out = [];
    var x = pad;

    layers.forEach(function (layer, i) {
      var w = usable * (weights[i] / totalWeight);
      var active = i === activeIndex;
      out.push('<rect class="wall-layer" data-index="' + i + '" x="' + num(x) + '" y="' + top + '" width="' + num(w) + '" height="170" ' +
        'fill="' + colors[i] + '" opacity="' + (activeIndex == null || active ? 1 : 0.32) + '" stroke="#1E2124" stroke-width="' + (active ? 2.5 : 1) + '"/>');
      if (fits(layer.thickness, fs(24), w - 4)) {
        out.push('<text x="' + num(x + w / 2) + '" y="' + labelY + '" text-anchor="middle" font-size="' + fs(24) + '" font-family="inherit" ' +
          'fill="' + (active ? '#1E2124' : '#9BA3A7') + '" font-weight="' + (active ? 600 : 400) + '">' + layer.thickness + '</text>');
      }
      x += w;
    });

    out.push('<text x="' + pad + '" y="' + (top - 12) + '" font-size="' + fs(24) + '" fill="#9BA3A7" font-family="inherit">снаружи</text>');
    out.push('<text x="' + (W - pad) + '" y="' + (top - 12) + '" text-anchor="end" font-size="' + fs(24) + '" fill="#9BA3A7" font-family="inherit">внутри</text>');
    out.push('<path d="M' + pad + ' ' + ruleY + 'H' + (W - pad) + '" stroke="#9BA3A7" stroke-width="1"/>');
    var totalLabel = pickLabel(['общая толщина стены — 290 мм', 'стена 290 мм'], fs(24), W - pad * 2);
    if (totalLabel) out.push('<text x="' + (W / 2) + '" y="' + totalY + '" text-anchor="middle" font-size="' + fs(24) + '" fill="#6D7478" font-family="inherit">' + totalLabel + '</text>');

    return '<svg class="nm-svg wall-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Разрез стены">' + out.join('') + '</svg>';
  };

  /* ================= СХЕМА ДОСТАВКИ ================= */

  /* Вид сбоку на разгрузку манипулятором и вид сверху на ворота. Перерисовывается от ответов
     проверки проезда: ширина ворот, высота препятствий над дорогой, вылет стрелы до места установки. */
  NM.svg.delivery = function (opts) {
    opts = opts || {};
    var fs = function (b) { return Math.round(b * (opts.fontScale || 1)); };
    var a = opts.access || {};
    var W = 1000, H = 400, PX = 30, ground = 318;
    var ink = '#1E2124', steel = '#6D7478', faint = '#B9C0C4', accent = '#C56B3E', warn = '#D29B2E', bad = '#C8453A';
    var tone = function (state) { return state === 'bad' ? bad : state === 'warn' ? warn : steel; };
    var out = [];
    var text = function (x, y, label, size, fill, anchor, weight) {
      return '<text x="' + num(x) + '" y="' + num(y) + '" font-size="' + fs(size) + '" fill="' + (fill || steel) + '" font-family="inherit"' +
        (anchor ? ' text-anchor="' + anchor + '"' : '') + (weight ? ' font-weight="' + weight + '"' : '') + '>' + label + '</text>';
    };
    var dimH = function (x0, x1, y, label, color) {
      return '<path d="M' + num(x0) + ' ' + (y - 7) + 'v14M' + num(x1) + ' ' + (y - 7) + 'v14M' + num(x0) + ' ' + y + 'H' + num(x1) + '" stroke="' + (color || steel) + '" stroke-width="1.3"/>' +
        text((x0 + x1) / 2, y - 8, label, 15, color || steel, 'middle');
    };

    /* Земля и дорога */
    out.push('<rect x="0" y="' + ground + '" width="' + W + '" height="' + (H - ground) + '" fill="#EEF0EE"/>');
    out.push('<path d="M0 ' + ground + 'H' + W + '" stroke="' + ink + '" stroke-width="2"/>');

    /* Грузовик: кабина слева, платформа, выносные опоры */
    var tx = 150, cabW = 2.4 * PX, cabH = 3.0 * PX, bedW = 6.6 * PX, bedY = ground - 1.25 * PX;
    var wheel = function (x) { return '<circle cx="' + num(x) + '" cy="' + (ground - 16) + '" r="16" fill="' + ink + '"/><circle cx="' + num(x) + '" cy="' + (ground - 16) + '" r="6" fill="' + faint + '"/>'; };
    out.push('<g>' +
      '<path d="M' + tx + ' ' + (ground - 22) + 'V' + num(ground - cabH + 14) + 'Q' + tx + ' ' + num(ground - cabH) + ' ' + (tx + 16) + ' ' + num(ground - cabH) + 'H' + num(tx + cabW) + 'V' + (ground - 22) + 'Z" fill="' + ink + '"/>' +
      '<path d="M' + (tx + 10) + ' ' + num(ground - cabH + 14) + 'h' + num(cabW * 0.55) + 'v' + num(cabH * 0.32) + 'h-' + num(cabW * 0.55) + 'Z" fill="#8FA9B8"/>' +
      '<rect x="' + num(tx + cabW) + '" y="' + num(bedY) + '" width="' + num(bedW) + '" height="14" fill="' + ink + '"/>' +
      '<rect x="' + num(tx + 4) + '" y="' + (ground - 30) + '" width="' + num(cabW + bedW - 8) + '" height="10" fill="#33393E"/>' +
      wheel(tx + 40) + wheel(tx + cabW + bedW - 90) + wheel(tx + cabW + bedW - 46) +
      '</g>');
    /* выносные опоры у основания крана */
    var craneX = tx + cabW + bedW - 30, craneTop = bedY - 1.1 * PX;
    out.push('<path d="M' + num(craneX - 10) + ' ' + num(bedY + 14) + 'L' + num(craneX - 34) + ' ' + ground + 'M' + num(craneX + 26) + ' ' + num(bedY + 14) + 'L' + num(craneX + 44) + ' ' + ground + '" stroke="' + steel + '" stroke-width="5"/>' +
      '<rect x="' + num(craneX - 44) + '" y="' + (ground - 5) + '" width="22" height="5" fill="' + steel + '"/><rect x="' + num(craneX + 34) + '" y="' + (ground - 5) + '" width="22" height="5" fill="' + steel + '"/>');
    out.push('<rect x="' + num(craneX - 6) + '" y="' + num(craneTop) + '" width="24" height="' + num(bedY - craneTop) + '" fill="' + accent + '"/>');

    /* Место установки на заданном расстоянии; вылет стрелы — 8 м от колонны */
    var reachM = { ok: 6.5, mid: 11.5, far: 16.5 }[a.reach] || 6.5;
    var maxReach = 8 * PX, pivotX = craneX + 6, pivotY = craneTop;
    var siteX = Math.min(W - 70, pivotX + reachM * PX);
    var within = reachM <= 8;
    var module = { w: 4.6 * PX, h: 2.9 * PX };
    /* сваи под модуль */
    var piles = '';
    for (var p = 0; p < 4; p++) piles += '<rect x="' + num(siteX - module.w / 2 + 6 + p * (module.w - 18) / 3) + '" y="' + (ground - 14) + '" width="6" height="30" fill="' + (within ? steel : bad) + '"/>';
    out.push(piles);
    out.push('<path d="M' + num(pivotX + maxReach) + ' ' + num(pivotY) + 'A' + maxReach + ' ' + maxReach + ' 0 0 0 ' + num(pivotX + maxReach * Math.cos(-1.1)) + ' ' + num(pivotY + maxReach * Math.sin(-1.1)) + '" fill="none" stroke="' + faint + '" stroke-width="1.5" stroke-dasharray="6 6"/>');
    out.push(text(pivotX + maxReach * Math.cos(-0.9) + 6, pivotY + maxReach * Math.sin(-0.9) - 6, 'вылет стрелы 8 м', 13, steel));

    /* Стрела: две секции до точки подвеса */
    var hookX = within ? siteX : pivotX + maxReach * 0.97;
    var hookY = ground - module.h - 1.6 * PX;
    var kneeX = pivotX + (hookX - pivotX) * 0.42, kneeY = Math.min(pivotY, hookY) - 1.6 * PX;
    out.push('<path d="M' + num(pivotX) + ' ' + num(pivotY) + 'L' + num(kneeX) + ' ' + num(kneeY) + 'L' + num(hookX) + ' ' + num(hookY - 8) + '" fill="none" stroke="' + accent + '" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>');
    out.push('<path d="M' + num(pivotX + 6) + ' ' + num(pivotY + 30) + 'L' + num((pivotX + kneeX) / 2) + ' ' + num((pivotY + kneeY) / 2 + 6) + '" stroke="' + ink + '" stroke-width="5"/>');
    /* модуль: на стропах над сваями или ещё на платформе */
    var mx = within ? siteX - module.w / 2 : tx + cabW + 8;
    var my = within ? ground - module.h - 26 : bedY - module.h;
    out.push('<path d="M' + num(hookX) + ' ' + num(hookY - 8) + 'V' + num(hookY + 10) + (within ? 'M' + num(hookX) + ' ' + num(hookY + 10) + 'L' + num(mx + 10) + ' ' + num(my) + 'M' + num(hookX) + ' ' + num(hookY + 10) + 'L' + num(mx + module.w - 10) + ' ' + num(my) : '') + '" stroke="' + ink + '" stroke-width="1.6"/>');
    out.push('<rect x="' + num(mx) + '" y="' + num(my) + '" width="' + num(module.w) + '" height="' + num(module.h) + '" fill="#A97240" stroke="' + ink + '" stroke-width="2"/>' +
      '<rect x="' + num(mx + module.w * 0.12) + '" y="' + num(my + module.h * 0.3) + '" width="' + num(module.w * 0.3) + '" height="' + num(module.h * 0.4) + '" fill="#FFD9A0" stroke="#7A4E29" stroke-width="3"/>' +
      '<rect x="' + num(mx - 6) + '" y="' + num(my - 8) + '" width="' + num(module.w + 12) + '" height="8" fill="#242B2F"/>');
    out.push(dimH(pivotX, siteX, ground + 44, String(reachM).replace('.', ',') + ' м до места установки', within ? steel : bad));
    if (!within) out.push(text(Math.min(W - 16, siteX + 70), ground - 64, 'не достаёт — нужен кран', 15, bad, 'end', 600));

    /* Препятствие над проездом: провод между опорами на заданной высоте */
    var wireM = { ok: 5.2, tight: 4.25, low: 3.7 }[a.height] || 5.2;
    var loadTop = 4.1; // высота машины с модулем на платформе, м
    var wireState = a.height === 'low' ? 'bad' : a.height === 'tight' ? 'warn' : 'ok';
    var wireY = ground - wireM * PX;
    out.push('<path d="M30 ' + ground + 'V' + num(wireY - 6) + 'M' + (tx - 22) + ' ' + ground + 'V' + num(wireY - 6) + '" stroke="' + faint + '" stroke-width="4"/>');
    out.push('<path d="M30 ' + num(wireY) + 'Q' + num((tx + 8) / 2) + ' ' + num(wireY + 8) + ' ' + (tx - 22) + ' ' + num(wireY) + '" fill="none" stroke="' + tone(wireState) + '" stroke-width="2.2"/>');
    out.push('<path d="M16 ' + num(wireY) + 'V' + ground + '" stroke="' + steel + '" stroke-width="1.2"/>' + text(36, wireM > loadTop ? wireY - 10 : wireY + 18, 'провод ' + String(wireM).replace('.', ',') + ' м', 14, tone(wireState)));
    out.push('<path d="M20 ' + num(ground - loadTop * PX) + 'H' + num(tx - 4) + '" stroke="' + steel + '" stroke-width="1" stroke-dasharray="4 4"/>' + text(36, wireM > loadTop ? ground - loadTop * PX + 15 : ground - loadTop * PX - 6, 'машина с модулем 4,1 м', 12, steel));

    /* Вид сверху: ворота и машина шириной 2,55 м */
    var gateM = { ok: 3.8, tight: 3.25, narrow: 2.8 }[a.width] || 3.8;
    var gs = 18, gx = W - 180, gy = 40, gateState = a.width === 'narrow' ? 'bad' : a.width === 'tight' ? 'warn' : 'ok';
    var gap = gateM * gs, truckW = 2.55 * gs;
    out.push('<rect x="' + (gx - 30) + '" y="' + (gy - 26) + '" width="210" height="160" rx="10" fill="#fff" stroke="#E3E6E8"/>');
    out.push(text(gx - 6, gy - 8, 'вид сверху · ворота', 12, steel));
    var cx = gx + 75;
    out.push('<rect x="' + num(cx - gap / 2 - 30) + '" y="' + (gy + 40) + '" width="30" height="8" fill="' + ink + '"/><rect x="' + num(cx + gap / 2) + '" y="' + (gy + 40) + '" width="30" height="8" fill="' + ink + '"/>');
    out.push('<rect x="' + num(cx - truckW / 2) + '" y="' + (gy + 6) + '" width="' + num(truckW) + '" height="92" rx="4" fill="' + (gateState === 'bad' ? 'rgba(200,69,58,.18)' : 'rgba(30,33,36,.12)') + '" stroke="' + tone(gateState === 'ok' ? 'ok' : gateState) + '" stroke-width="1.6"/>');
    out.push('<path d="M' + num(cx - gap / 2) + ' ' + (gy + 64) + 'H' + num(cx + gap / 2) + '" stroke="' + tone(gateState) + '" stroke-width="1.3"/>' + text(cx, gy + 114, 'проезд ' + String(gateM).replace('.', ',') + ' м', 13, tone(gateState), 'middle', 600) + text(cx, gy + 128, 'машина 2,55 м', 11, steel, 'middle'));

    /* Человек для масштаба у места установки */
    var hh = 1.8 * PX, hx = Math.min(W - 40, siteX + module.w / 2 + 16);
    out.push('<path d="' + HUMAN_PATH.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, function (m0, x, y) { return (hx + parseFloat(x) * hh).toFixed(1) + ',' + (ground - hh + parseFloat(y) * hh).toFixed(1); }) + '" fill="' + ink + '" opacity=".75"/>');
    out.push('<circle cx="' + (hx + 0.21 * hh).toFixed(1) + '" cy="' + (ground - hh + 0.09 * hh).toFixed(1) + '" r="' + (0.085 * hh).toFixed(1) + '" fill="' + ink + '" opacity=".75"/>');

    return '<svg class="nm-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Схема доставки модуля манипулятором">' + out.join('') + '</svg>';
  };

})(window.NM);
