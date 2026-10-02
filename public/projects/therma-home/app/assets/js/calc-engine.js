/*
 * calc-engine — расчётное ядро THERMA HOME.
 * Единственный источник правды для калькулятора, блока экономики и PDF.
 * Чистые функции без DOM: модуль переносится в Next.js как есть.
 */
(function (global) {
  'use strict';

  var T_INDOOR = 20;

  /* Расчётные температуры наружного воздуха и тарифы по регионам */
  var REGIONS = [
    { id: 'moscow',   name: 'Москва и область',   tOut: -28, hdd: 4900, tariff: 6.7, service: true },
    { id: 'spb',      name: 'Санкт-Петербург и ЛО', tOut: -26, hdd: 4700, tariff: 6.4, service: true },
    { id: 'tver',     name: 'Тверь, Ярославль',   tOut: -29, hdd: 5100, tariff: 5.9, service: true },
    { id: 'kaluga',   name: 'Калуга, Тула, Рязань', tOut: -27, hdd: 4850, tariff: 6.1, service: true },
    { id: 'nnov',     name: 'Нижний Новгород',    tOut: -31, hdd: 5200, tariff: 6.0, service: true },
    { id: 'kazan',    name: 'Казань',             tOut: -32, hdd: 5300, tariff: 5.6, service: true },
    { id: 'krasnodar',name: 'Краснодар, Сочи',    tOut: -19, hdd: 3200, tariff: 7.2, service: false },
    { id: 'ekb',      name: 'Екатеринбург',       tOut: -35, hdd: 5900, tariff: 5.4, service: false },
    { id: 'novosib',  name: 'Новосибирск',        tOut: -37, hdd: 6300, tariff: 4.8, service: false },
    { id: 'other',    name: 'Другой регион',      tOut: -30, hdd: 5200, tariff: 6.0, service: false }
  ];

  /* Удельные теплопотери, Вт/м², приведённые к расчётной температуре Москвы.
     Базовые значения откалиброваны по двум эталонным домам из блока сравнения:
     газобетон 400 + энергоокна + утеплённая кровля → 52 Вт/м²,
     кирпич 380 без утепления + старые окна + холодная кровля → 104 Вт/м². */
  var WALL_Q = {
    aerated: 60,   // газобетон / керамоблок
    brick:   76,   // кирпич
    frame:   62,   // каркас с минватой
    timber:  82,   // брус / бревно
    unknown: 80
  };

  /* Потолок удельных теплопотерь: выше 140 Вт/м² реальных домов практически не бывает */
  var Q_MAX = 140;

  var THICKNESS_K = { thin: 1.22, normal: 1.0, thick: 0.86, unknown: 1.08 };
  var YEAR_K      = { new: 0.94, y2000: 1.0, y1990: 1.14, old: 1.3, unknown: 1.06 };
  var WINDOW_K    = { energy: 0.93, double: 1.0, old: 1.16 };
  var ROOF_K      = { yes: 0.94, partial: 1.05, no: 1.18, unknown: 1.05 };

  /* Прайс-матрица: базовые цены, ₽. Мин/макс формируются коэффициентом diapason */
  var PRICE = {
    pumpAirPerKw: 58000,
    pumpAirMin: 520000,
    pumpGroundPerKw: 86000,
    drillingPerKw: 42000,        // геозонд ~ 12 п.м. на 1 кВт
    dhwTank: { 200: 78000, 300: 96000, 400: 132000, 500: 168000 },
    buffer: 54000,
    peakHeater: 46000,
    hydraulicsBase: 145000,
    hydraulicsPerKw: 5200,
    cascadeExtra: 145000,
    threePhaseExtra: 0,
    onePhaseLimitKw: 12,
    installShare: 0.21,          // доля от стоимости оборудования
    projectBase: 52000,
    projectPerKw: 1800,
    diapason: 0.16               // ширина вилки ±16 %
  };

  var SCOP = { floor: 3.9, mixed: 3.5, radiators: 3.1, undecided: 3.5 };
  var SCOP_GROUND_BONUS = 0.55;
  var SCOP_DHW = 2.8;

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function getRegion(id) {
    for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i];
    return REGIONS[0];
  }

  /* Класс теплопотерь: удельные Вт/м² и человекочитаемая метка */
  function heatLossClass(a) {
    var q = WALL_Q[a.wall] || WALL_Q.unknown;
    q *= THICKNESS_K[a.thickness] || THICKNESS_K.unknown;
    q *= YEAR_K[a.year] || YEAR_K.unknown;
    q *= WINDOW_K[a.windows] || WINDOW_K.double;
    q *= ROOF_K[a.roof] || ROOF_K.unknown;
    if (a.ceiling && a.ceiling > 3) q *= 1 + (a.ceiling - 3) * 0.05;

    /* Множители независимы, но «тонкие стены», «старые окна», «холодная кровля»
       и «дом до 1990» — во многом один и тот же признак. Без потолка их
       перемножение даёт физически недостижимые 160–180 Вт/м². */
    q = Math.min(q, Q_MAX);

    var label = 'среднее';
    if (q <= 55) label = 'хорошее';
    else if (q <= 70) label = 'выше среднего';
    else if (q <= 90) label = 'среднее';
    else label = 'слабое';

    return { q: Math.round(q), label: label };
  }

  /* Полные теплопотери дома, кВт */
  function heatLoss(a) {
    var cls = heatLossClass(a);
    var region = getRegion(a.region);
    var kRegion = (T_INDOOR - region.tOut) / (T_INDOOR - (-28));
    var kw = (a.area * cls.q * kRegion) / 1000;
    return { kw: Math.round(kw * 10) / 10, q: cls.q, label: cls.label, kRegion: Math.round(kRegion * 100) / 100 };
  }

  /* Объём бойлера ГВС по числу жильцов и санузлов */
  function dhwVolume(a) {
    var people = a.people || 3;
    var v = people * 55 + (a.bathrooms > 1 ? 60 : 0) + (a.bath ? 40 : 0);
    if (v <= 200) return 200;
    if (v <= 300) return 300;
    if (v <= 400) return 400;
    return 500;
  }

  /* Подбор конфигурации системы */
  function configure(a) {
    var loss = heatLoss(a);
    var region = getRegion(a.region);
    var dhwPower = (a.people || 3) * 0.25;
    var needed = loss.kw * 1.1;

    var type = 'air';
    var reasons = [];

    if (needed > 22) {
      type = 'ground';
      reasons.push('Расчётная мощность выше 22 кВт — грунтовый контур даёт стабильный COP без пикового доводчика.');
    }
    if (region.tOut <= -33 && type === 'air') {
      type = 'ground';
      reasons.push('Расчётная температура региона ' + formatTemp(region.tOut) + ' — воздушный насос потребует слишком большого доводчика.');
    }

    var hybrid = !!(a.existing && a.existing !== 'none' && a.existing !== 'stove');
    if (hybrid) {
      reasons.push('У вас есть рабочий котёл — используем его как пиковый источник, это снижает стоимость системы.');
    }

    /* Мощность насоса из типоразмерного ряда */
    var lineup = type === 'ground' ? [8, 10, 12, 16, 20, 24, 30, 36] : [6, 8, 10, 12, 14, 16, 20, 24];
    var maxStock = lineup[lineup.length - 1];
    var target = hybrid ? needed * 0.75 : needed;
    var power = maxStock;
    var oversize = false;

    for (var i = 0; i < lineup.length; i++) {
      if (lineup[i] >= target) { power = lineup[i]; break; }
    }
    /* Нагрузка выше типоразмерного ряда: молча упереться в максимум нельзя —
       это даст заниженную систему при завышенной цене. Считаем честный каскад
       и помечаем объект как требующий индивидуального проекта. */
    if (target > maxStock) {
      power = Math.ceil(target / 2) * 2;
      oversize = true;
      reasons.push('Расчётная нагрузка выше серийного ряда — потребуется каскад из нескольких блоков и индивидуальный проект.');
    }

    var bivalent = type === 'air' && region.tOut < -25;
    var peakHeater = bivalent && !hybrid;
    var cascade = power > 16;

    /* Электрика: проверка выделенной мощности */
    var scop = SCOP[a.emitters] || SCOP.mixed;
    if (type === 'ground') scop += SCOP_GROUND_BONUS;
    var peakDraw = power / 3.2 + (peakHeater ? 6 : 0);
    var declared = a.power === 'unknown' ? 15 : Number(a.power);
    var powerOk = declared >= peakDraw + 3;
    var phaseIssue = a.phases === 1 && power > PRICE.onePhaseLimitKw;

    var blocked = !powerOk && declared < 10 && loss.kw > 12;

    return {
      type: type,
      typeLabel: type === 'ground' ? 'Грунт — вода' : 'Воздух — вода',
      power: power,
      loss: loss,
      dhwPower: Math.round(dhwPower * 10) / 10,
      dhwVolume: dhwVolume(a),
      bufferVolume: power <= 10 ? 100 : power <= 16 ? 200 : 300,
      hybrid: hybrid,
      bivalent: bivalent,
      peakHeater: peakHeater,
      cascade: cascade,
      oversize: oversize,
      scop: Math.round(scop * 10) / 10,
      peakDraw: Math.round(peakDraw * 10) / 10,
      declaredPower: declared,
      powerOk: powerOk,
      phaseIssue: phaseIssue,
      blocked: blocked,
      region: region,
      reasons: reasons
    };
  }

  /* Смета по составляющим */
  function estimate(cfg) {
    var items = [];
    var pumpCost = cfg.type === 'ground'
      ? cfg.power * PRICE.pumpGroundPerKw + cfg.power * PRICE.drillingPerKw
      : Math.max(PRICE.pumpAirMin, cfg.power * PRICE.pumpAirPerKw);

    if (cfg.cascade) pumpCost += PRICE.cascadeExtra;
    /* Пиковый доводчик — источник тепла, а не часть обвязки:
       держим его в этой строке, чтобы доля обвязки не «распухала». */
    if (cfg.peakHeater) pumpCost += PRICE.peakHeater;

    var pumpTitle = cfg.type === 'ground' ? 'Тепловой насос и грунтовый контур' : 'Тепловой насос';
    if (cfg.peakHeater) pumpTitle += ' с пиковым доводчиком';

    items.push({
      key: 'pump',
      title: pumpTitle,
      note: cfg.typeLabel + ', ' + cfg.power + ' кВт' + (cfg.cascade ? ', каскад из двух блоков' : ', инверторный') +
        (cfg.peakHeater ? ', доводчик 6 кВт' : ''),
      value: pumpCost
    });

    var tanks = (PRICE.dhwTank[cfg.dhwVolume] || 96000) + PRICE.buffer;
    items.push({
      key: 'tanks',
      title: 'Бойлер ГВС и буферная ёмкость',
      note: 'Бойлер ' + cfg.dhwVolume + ' л, буфер ' + cfg.bufferVolume + ' л',
      value: tanks
    });

    var hydraulics = PRICE.hydraulicsBase + cfg.power * PRICE.hydraulicsPerKw;
    items.push({
      key: 'hydraulics',
      title: 'Обвязка котельной и автоматика',
      note: 'Насосные группы, коллекторы, погодозависимое управление' + (cfg.hybrid ? ', врезка существующего котла' : ''),
      value: hydraulics
    });

    var equipment = pumpCost + tanks + hydraulics;
    var install = equipment * PRICE.installShare;
    items.push({
      key: 'install',
      title: 'Монтаж и пусконаладка',
      note: 'Работы по котельной, трассы, заправка, настройка кривых отопления',
      value: install
    });

    var project = PRICE.projectBase + cfg.power * PRICE.projectPerKw;
    items.push({
      key: 'project',
      title: 'Проект и документация',
      note: 'Теплотехнический расчёт, схема котельной, акты ПНР',
      value: project
    });

    var total = items.reduce(function (s, it) { return s + it.value; }, 0);
    var min = total * (1 - PRICE.diapason);
    var max = total * (1 + PRICE.diapason);

    items.forEach(function (it) {
      it.share = Math.round((it.value / total) * 100);
      it.min = round1k(it.value * (1 - PRICE.diapason));
      it.max = round1k(it.value * (1 + PRICE.diapason));
    });

    return { items: items, total: round1k(total), min: round1k(min), max: round1k(max) };
  }

  /* Годовая потребность в тепле и стоимость эксплуатации */
  function operation(a, cfg) {
    var region = cfg.region;
    var dT = T_INDOOR - region.tOut;
    var heatYear = (cfg.loss.kw * 24 * region.hdd) / dT;              // кВт·ч тепла на отопление
    var dhwYear = (a.people || 3) * 55 * 365 * 4.18 * 40 / 3600000 * 1000; // кВт·ч тепла на ГВС

    var elHeat = heatYear / cfg.scop;
    var elDhw = dhwYear / SCOP_DHW;
    var elYear = elHeat + elDhw;
    var costYear = elYear * region.tariff;

    return {
      heatYear: Math.round(heatYear),
      dhwYear: Math.round(dhwYear),
      elYear: Math.round(elYear),
      costYear: round1k(costYear),
      costMonth: round1k(costYear / 7),   // усреднение по отопительному сезону
      tariff: region.tariff
    };
  }

  /* Сравнение стоимости владения на 10 лет с альтернативами */
  var ALTERNATIVES = [
    { id: 'hp',       name: 'Тепловой насос',      capex: null, unit: null },
    { id: 'electric', name: 'Электрокотёл',        capex: 260000,  kwhPerKwh: 1.02,  price: null },
    { id: 'propane',  name: 'Газгольдер',          capex: 720000,  kwhPerUnit: 6.0,  unitPrice: 33 },
    { id: 'diesel',   name: 'Дизельный котёл',     capex: 480000,  kwhPerUnit: 9.2,  unitPrice: 72 },
    { id: 'gas',      name: 'Магистральный газ',   capex: 1150000, kwhPerUnit: 8.7,  unitPrice: 8.5 }
  ];

  function ownership(a, cfg, est, op, years) {
    years = years || 10;
    var region = cfg.region;
    var demand = op.heatYear + op.dhwYear;
    var rows = [];

    rows.push({
      id: 'hp',
      name: 'Тепловой насос',
      capex: est.total,
      opexYear: op.costYear,
      total: round1k(est.total + op.costYear * years)
    });

    ALTERNATIVES.slice(1).forEach(function (alt) {
      var opex;
      if (alt.id === 'electric') opex = demand * alt.kwhPerKwh * region.tariff;
      else opex = (demand / alt.kwhPerUnit) * alt.unitPrice;
      rows.push({
        id: alt.id,
        name: alt.name,
        capex: alt.capex,
        opexYear: round1k(opex),
        total: round1k(alt.capex + opex * years)
      });
    });

    /* Точка окупаемости относительно каждой альтернативы */
    var hp = rows[0];
    rows.forEach(function (r) {
      if (r.id === 'hp') { r.payback = null; return; }
      var deltaCapex = hp.capex - r.capex;
      var deltaOpex = r.opexYear - hp.opexYear;
      r.payback = deltaOpex > 0 && deltaCapex > 0 ? Math.round((deltaCapex / deltaOpex) * 10) / 10 : 0;
    });

    return { years: years, rows: rows };
  }

  /* Скоринг заявки */
  function score(a, cfg) {
    var pts = 0;
    var log = [];

    function add(n, why) { pts += n; log.push({ n: n, why: why }); }

    if (a.area >= 120 && a.area <= 350) add(20, 'Площадь в целевом диапазоне');
    else if (a.area > 350) add(12, 'Крупный объект');
    else add(6, 'Небольшой дом');

    if (a.stage === 'building' || a.stage === 'design') add(20, 'Дом на стадии проекта или стройки');
    else if (a.existing && a.existing !== 'none' && a.existing !== 'gas') add(15, 'Готовый дом с дорогим отоплением');
    else add(8, 'Готовый дом');

    if (cfg.region.service) add(15, 'Регион в зоне монтажа');
    if (cfg.declaredPower >= 15) add(10, 'Достаточная выделенная мощность');
    if (a.plans && a.plans.length) add(15, 'Загружен план дома');
    if (!a.hasUnknowns) add(10, 'Все вводные заполнены без «не знаю»');
    if (a.slot) add(10, 'Выбран слот звонка');
    if (a.phone && a.email) add(5, 'Оставлены телефон и email');
    if (a.emitters === 'floor' || a.emitters === 'mixed') add(5, 'Низкотемпературные контуры');

    var grade = pts >= 70 ? 'A' : pts >= 40 ? 'B' : 'C';
    if (!cfg.region.service) grade = 'C';

    var route = {
      A: 'Уведомление инженеру в Telegram, звонок в течение рабочего часа',
      B: 'Звонок в течение дня, до звонка — письмо с PDF и похожим кейсом',
      C: 'Без звонка, email-цепочка прогрева из трёх писем'
    }[grade];

    return { points: pts, grade: grade, route: route, log: log };
  }

  /* Полный расчёт */
  function calculate(a) {
    var cfg = configure(a);
    var est = estimate(cfg);
    var op = operation(a, cfg);
    return {
      answers: a,
      config: cfg,
      estimate: est,
      operation: op,
      ownership: ownership(a, cfg, est, op, 10),
      score: score(a, cfg),
      assumptions: assumptions(a, cfg)
    };
  }

  /* Список принятых допущений — показывается клиенту открыто */
  function assumptions(a, cfg) {
    var list = [];
    if (a.wall === 'unknown') list.push('Материал стен не указан — принят класс теплопотерь «среднее»');
    if (a.thickness === 'unknown') list.push('Толщина стен не указана — принято среднее значение');
    if (a.year === 'unknown') list.push('Год постройки не указан — принят коэффициент для дома 2000-х');
    if (a.roof === 'unknown') list.push('Утепление кровли не подтверждено — принято частичное');
    if (a.power === 'unknown') list.push('Выделенная мощность принята 15 кВт — обязательно уточним');
    if (a.emitters === 'undecided') list.push('Тип контуров не выбран — расчёт для смешанной схемы 45 °C');
    list.push('Расчётная температура для «' + cfg.region.name + '» принята ' + formatTemp(cfg.region.tOut) + ' по СП 131.13330');
    list.push('Тариф на электроэнергию принят ' + formatDec(cfg.region.tariff) + ' ₽/кВт·ч');
    list.push('Внутренняя температура принята +' + T_INDOOR + ' °C');
    return list;
  }

  function round1k(v) { return Math.round(v / 1000) * 1000; }

  function formatMoney(v) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(v)) + ' ₽';
  }

  function formatShort(v) {
    if (v >= 1000000) return (Math.round(v / 100000) / 10).toFixed(1).replace('.', ',') + ' млн ₽';
    return Math.round(v / 1000) + ' тыс ₽';
  }

  /* Десятичная запятая вместо точки */
  function formatDec(v) {
    return String(Math.round(v * 10) / 10).replace('.', ',');
  }

  /* Температура с типографским минусом U+2212 */
  function formatTemp(t) {
    return (t < 0 ? '−' : '+') + formatDec(Math.abs(t)) + ' °C';
  }

  global.CalcEngine = {
    REGIONS: REGIONS,
    T_INDOOR: T_INDOOR,
    calculate: calculate,
    configure: configure,
    estimate: estimate,
    operation: operation,
    ownership: ownership,
    heatLoss: heatLoss,
    score: score,
    formatMoney: formatMoney,
    formatShort: formatShort,
    formatDec: formatDec,
    formatTemp: formatTemp
  };
})(window);
