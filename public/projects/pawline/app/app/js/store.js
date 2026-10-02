/* ============================================================
   PAWLINE — состояние приложения
   Local-first: localStorage как источник правды для интерфейса,
   очередь операций имитирует синхронизацию с сервером.
   ============================================================ */
(function (global) {
  "use strict";

  var KEY = "pawline.state.v1";
  var MINUTE = 60 * 1000;

  /* --- утилиты ------------------------------------------ */

  function uid() {
    return "id-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
  }

  function hhmm(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function dateRu(iso) {
    var d = new Date(iso);
    var months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / (24 * 60 * MINUTE));
  }

  function plural(n, one, few, many) {
    var m10 = n % 10;
    var m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  /* --- начальные данные --------------------------------- */

  function seed() {
    var now = Date.now();
    var at = function (min) {
      return now + min * MINUTE;
    };

    var tasks = [
      {
        type: "food",
        title: "Утренний корм",
        detail: "120 г сухого",
        plannedAt: at(-195),
        status: "done",
        completedBy: "m1",
        completedAt: at(-188),
        instruction: "Насыпать в правую миску, воду менять одновременно."
      },
      {
        type: "med",
        title: "Апоквел 16 мг",
        detail: "1 таблетка",
        plannedAt: at(-150),
        status: "done",
        completedBy: "m2",
        completedAt: at(-145),
        instruction: "Прятать в кусочек паштета, строго после еды.",
        courseId: "c1"
      },
      {
        type: "walk",
        title: "Утренняя прогулка",
        detail: "40 минут",
        plannedAt: at(-105),
        status: "done",
        completedBy: "m2",
        completedAt: at(-99)
      },
      {
        type: "care",
        title: "Чистка ушей",
        detail: "Обе стороны",
        plannedAt: at(-40),
        status: "planned",
        instruction: "Лосьон в ухо, помассировать, дать отряхнуться, снаружи протереть салфеткой."
      },
      {
        type: "food",
        title: "Вечерний корм",
        detail: "120 г сухого",
        plannedAt: at(20),
        status: "planned",
        instruction: "Насыпать в правую миску, воду менять одновременно."
      },
      {
        type: "med",
        title: "Апоквел 16 мг",
        detail: "1 таблетка",
        plannedAt: at(75),
        status: "planned",
        instruction: "Прятать в кусочек паштета, строго после еды.",
        courseId: "c1"
      },
      {
        type: "walk",
        title: "Вечерняя прогулка",
        detail: "30 минут",
        plannedAt: at(150),
        status: "planned"
      },
      {
        type: "weight",
        title: "Взвешивание",
        detail: "Раз в неделю",
        plannedAt: at(210),
        status: "planned"
      }
    ].map(function (t) {
      return Object.assign({ id: uid(), synced: true, skipReason: null, note: null }, t);
    });

    return {
      version: 1,
      createdAt: now,
      me: "m1",
      settings: {
        theme: "light",
        online: true,
        notif: { med: true, food: true, walk: true, info: false, quiet: true }
      },
      pet: {
        name: "Рекс",
        species: "Собака",
        breed: "Лабрадор-ретривер",
        birth: "2021-04-12",
        sex: "Кобель",
        neutered: true,
        chip: "643094100271845",
        color: "Палевый",
        allergies: "Курица, говядина. Атопический дерматит.",
        care: [
          { k: "Корм", v: "Сухой гипоаллергенный, 120 г утром и вечером" },
          { k: "Нельзя", v: "Курица, говядина, сладкое, кости" },
          { k: "Прогулки", v: "Утром 40 минут, вечером 30. Тянет на кошек" },
          { k: "Характер", v: "Дружелюбный, боится грозы и фейерверков" },
          { k: "Вещи", v: "Корм и лекарства — верхняя полка в прихожей" }
        ]
      },
      members: [
        { id: "m1", name: "Маша", initial: "М", color: "purple", role: "owner" },
        { id: "m2", name: "Дима", initial: "Д", color: "teal", role: "member" },
        { id: "m3", name: "Костя", initial: "К", color: "coral", role: "sitter", expires: "2026-08-12" }
      ],
      tasks: tasks,
      course: {
        id: "c1",
        drug: "Апоквел",
        doseText: "16 мг, 1 таблетка",
        frequency: "2 раза в день — 09:00 и 21:00",
        totalDays: 21,
        currentDay: 12,
        takenCount: 23,
        plannedCount: 23,
        note: "Прятать в паштет, строго после еды",
        prescribedBy: "Дерматолог, клиника «Био-Вет»",
        startedAt: "2026-07-15"
      },
      doseHistory: [
        { day: "Сегодня", time: "09:05", by: "m2", status: "ok" },
        { day: "Вчера", time: "21:10", by: "m1", status: "ok" },
        { day: "Вчера", time: "09:02", by: "m1", status: "ok" },
        { day: "24 июля", time: "21:30", by: "m2", status: "skip", reason: "Выплюнул, повтор через 20 минут" },
        { day: "24 июля", time: "09:00", by: "m2", status: "ok" },
        { day: "23 июля", time: "21:15", by: "m1", status: "ok" }
      ],
      vaccinations: [
        { type: "Бешенство", date: "2026-05-04", product: "Нобивак Rabies", batch: "A241-08", clinic: "Био-Вет", next: "2027-05-04" },
        { type: "Комплексная DHPPi", date: "2025-08-19", product: "Нобивак DHPPi", batch: "B117-22", clinic: "Био-Вет", next: "2026-08-19" },
        { type: "Лептоспироз", date: "2025-06-02", product: "Нобивак Lepto", batch: "C903-14", clinic: "Био-Вет", next: "2026-06-02" }
      ],
      weights: [
        { date: "2026-01-18", kg: 17.2 },
        { date: "2026-02-22", kg: 17.6 },
        { date: "2026-03-21", kg: 17.5 },
        { date: "2026-04-19", kg: 17.9 },
        { date: "2026-05-24", kg: 18.1 },
        { date: "2026-06-21", kg: 18.0 },
        { date: "2026-07-19", kg: 18.4 }
      ],
      weightTarget: { min: 17, max: 19 },
      timeline: [
        { date: "2026-07-22", kind: "symptom", title: "Зуд прошёл", text: "Расчёсы за ухом больше не появляются", tone: "teal" },
        { date: "2026-07-20", kind: "visit", title: "Приём у дерматолога", text: "Назначен апоквел 16 мг на 21 день", tone: "teal" },
        { date: "2026-07-18", kind: "symptom", title: "Зуд, расчёсы за ухом", text: "Интенсивность 3 из 5 — субъективная оценка владельца", tone: "coral" },
        { date: "2026-05-04", kind: "vaccine", title: "Вакцинация от бешенства", text: "Нобивак Rabies, серия A241-08", tone: "mute" },
        { date: "2026-04-19", kind: "weight", title: "Взвешивание — 17,9 кг", text: "", tone: "mute" }
      ],
      documents: [
        { name: "Ветпаспорт", cat: "Документы", icon: "ti-id", pinned: true },
        { name: "Анализ крови", cat: "Анализы", icon: "ti-report-medical", pinned: true },
        { name: "Заключение дерматолога", cat: "Заключения", icon: "ti-file-description", pinned: true },
        { name: "Чип — свидетельство", cat: "Документы", icon: "ti-scan", pinned: false },
        { name: "Чек за приём", cat: "Чеки", icon: "ti-receipt", pinned: false }
      ],
      contacts: [
        { kind: "Клиника", name: "Био-Вет, круглосуточно", phone: "+7 495 000-11-22" },
        { kind: "Врач", name: "Дерматолог Смирнова А. В.", phone: "+7 495 000-33-44" }
      ],
      activity: [],
      pending: []
    };
  }

  /* --- загрузка и сохранение ---------------------------- */

  var state = null;

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) return parsed;
      }
    } catch (e) {
      /* повреждённое или недоступное хранилище — начинаем заново */
    }
    return seed();
  }

  function save() {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* приватный режим или переполнение — прототип продолжает работать в памяти */
    }
  }

  function reset() {
    state = seed();
    save();
    emit();
  }

  /* --- подписка ----------------------------------------- */

  var listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
  }

  function emit() {
    listeners.forEach(function (fn) {
      fn(state);
    });
  }

  /* --- выборки ------------------------------------------ */

  function member(id) {
    return (
      state.members.filter(function (m) {
        return m.id === id;
      })[0] || null
    );
  }

  function me() {
    return member(state.me);
  }

  function taskById(id) {
    return (
      state.tasks.filter(function (t) {
        return t.id === id;
      })[0] || null
    );
  }

  /**
   * Секции экрана «Сегодня». Порядок фиксирован — просроченное всегда сверху.
   * «Сейчас» — окно от текущего момента на час вперёд.
   */
  function sections() {
    var now = Date.now();
    var out = { late: [], now: [], next: [], done: [] };

    state.tasks
      .slice()
      .sort(function (a, b) {
        return a.plannedAt - b.plannedAt;
      })
      .forEach(function (t) {
        if (t.status === "done" || t.status === "skipped") {
          out.done.push(t);
        } else if (t.plannedAt < now) {
          out.late.push(t);
        } else if (t.plannedAt <= now + 60 * MINUTE) {
          out.now.push(t);
        } else {
          out.next.push(t);
        }
      });

    return out;
  }

  function progress() {
    var total = state.tasks.length;
    var done = state.tasks.filter(function (t) {
      return t.status === "done";
    }).length;
    return { done: done, total: total, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function unsyncedCount() {
    return state.tasks.filter(function (t) {
      return !t.synced;
    }).length;
  }

  function activeToday() {
    var ids = {};
    state.tasks.forEach(function (t) {
      if (t.completedBy) ids[t.completedBy] = true;
    });
    return Object.keys(ids).map(member).filter(Boolean);
  }

  /* --- действия ----------------------------------------- */

  function pushActivity(text, memberId, ts) {
    state.activity.unshift({ id: uid(), text: text, by: memberId, at: ts || Date.now() });
    state.activity = state.activity.slice(0, 12);
  }

  /**
   * Отметка выполнения.
   * Возвращает результат, чтобы интерфейс мог показать нейтральное сообщение
   * при конфликте вместо обвиняющей ошибки.
   */
  function complete(taskId, byId) {
    var task = taskById(taskId);
    if (!task) return { ok: false };

    if (task.status === "done") {
      var who = member(task.completedBy);
      return {
        ok: false,
        conflict: true,
        by: who,
        at: task.completedAt,
        // Формулировки родонейтральны: род участника приложению неизвестен
        message: "Уже отмечено — " + (who ? who.name : "другой участник") + ", " + hhmm(task.completedAt)
      };
    }

    var actor = byId || state.me;
    task.status = "done";
    task.completedBy = actor;
    task.completedAt = Date.now();
    task.skipReason = null;
    // офлайн-отметка живёт локально и уезжает на сервер при восстановлении связи
    task.synced = state.settings.online;

    if (task.courseId) {
      state.course.takenCount += 1;
      state.course.plannedCount += 1;
      state.doseHistory.unshift({
        day: "Сегодня",
        time: hhmm(task.completedAt),
        by: actor,
        status: "ok"
      });
    }

    pushActivity("отметка: " + task.title, actor, task.completedAt);
    save();
    emit();
    return { ok: true, task: task, offline: !state.settings.online };
  }

  function undo(taskId) {
    var task = taskById(taskId);
    if (!task) return false;

    if (task.courseId && task.status === "done") {
      state.course.takenCount = Math.max(0, state.course.takenCount - 1);
      state.course.plannedCount = Math.max(0, state.course.plannedCount - 1);
      state.doseHistory.shift();
    }

    task.status = "planned";
    task.completedBy = null;
    task.completedAt = null;
    task.skipReason = null;
    task.synced = true;
    state.activity.shift();
    save();
    emit();
    return true;
  }

  function skip(taskId, reason) {
    var task = taskById(taskId);
    if (!task) return false;
    task.status = "skipped";
    task.skipReason = reason;
    task.completedBy = state.me;
    task.completedAt = Date.now();
    task.synced = state.settings.online;

    if (task.courseId) {
      state.course.plannedCount += 1;
      state.doseHistory.unshift({
        day: "Сегодня",
        time: hhmm(task.completedAt),
        by: state.me,
        status: "skip",
        reason: reason
      });
    }

    pushActivity("пропуск: " + task.title + " — " + reason.toLowerCase(), state.me, task.completedAt);
    save();
    emit();
    return true;
  }

  function snooze(taskId, minutes) {
    var task = taskById(taskId);
    if (!task) return false;
    task.plannedAt = Date.now() + minutes * MINUTE;
    save();
    emit();
    return true;
  }

  /* --- создание записей --------------------------------- */

  /** Превращает «9:05» / «09.05» в миллисекунды сегодняшнего дня. */
  function parseTimeToday(str) {
    var m = String(str).trim().replace(/[.,]/g, ":").split(":");
    if (m.length !== 2) return null;
    var h = parseInt(m[0], 10);
    var min = parseInt(m[1], 10);
    if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
    var d = new Date();
    d.setHours(h, min, 0, 0);
    return d.getTime();
  }

  function addTask(type, title, detail, timeStr) {
    var at = parseTimeToday(timeStr);
    if (!title.trim() || at === null) return null;

    var task = {
      id: uid(),
      type: type,
      title: title.trim(),
      detail: detail.trim(),
      plannedAt: at,
      status: "planned",
      completedBy: null,
      completedAt: null,
      skipReason: null,
      note: null,
      instruction: null,
      synced: state.settings.online
    };
    state.tasks.push(task);
    save();
    emit();
    return task;
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(function (t) {
      return t.id !== id;
    });
    save();
    emit();
  }

  /**
   * Курс порождает задачи — по одной на каждый приём.
   * Дозировка сохраняется строкой и не разбирается: приложение не считает дозы.
   */
  function addCourse(drug, doseText, timesStr, days, note) {
    var times = String(timesStr)
      .split(",")
      .map(function (s) { return parseTimeToday(s); })
      .filter(function (v) { return v !== null; });

    var totalDays = parseInt(days, 10);
    if (!drug.trim() || !doseText.trim() || !times.length || !totalDays || totalDays < 1) return null;

    var horizon = Math.min(totalDays, 14);
    var now = Date.now();
    var created = 0;

    for (var day = 0; day < horizon; day++) {
      for (var i = 0; i < times.length; i++) {
        var at = times[i] + day * 24 * 60 * MINUTE;
        // Прошедшие сегодня приёмы не создаём — иначе курс открывается пачкой просрочек
        if (at < now) continue;
        state.tasks.push({
          id: uid(),
          type: "med",
          title: drug.trim() + " " + doseText.trim(),
          detail: doseText.trim(),
          plannedAt: at,
          status: "planned",
          completedBy: null,
          completedAt: null,
          skipReason: null,
          note: null,
          instruction: note.trim() || null,
          synced: state.settings.online,
          courseId: "c-" + uid()
        });
        created++;
      }
    }

    var label = times.map(hhmm).join(", ");
    state.course = {
      id: uid(),
      drug: drug.trim(),
      doseText: doseText.trim(),
      frequency: times.length + " " + plural(times.length, "раз", "раза", "раз") + " в день — " + label,
      totalDays: totalDays,
      currentDay: 1,
      takenCount: 0,
      plannedCount: 0,
      note: note.trim(),
      prescribedBy: "указано владельцем",
      startedAt: new Date().toISOString().slice(0, 10)
    };

    state.timeline.unshift({
      date: new Date().toISOString().slice(0, 10),
      kind: "course",
      title: "Начат курс: " + drug.trim(),
      text: doseText.trim() + ", " + totalDays + " дн.",
      tone: "teal"
    });

    pushActivity("новый курс: " + drug.trim(), state.me);
    save();
    emit();
    return { created: created, total: totalDays };
  }

  function addWeight(kg) {
    var value = parseFloat(String(kg).replace(",", "."));
    if (!value || value <= 0) return null;
    state.weights.push({ date: new Date().toISOString().slice(0, 10), kg: value });
    pushActivity("вес: " + String(value).replace(".", ",") + " кг", state.me);
    save();
    emit();
    return value;
  }

  function addVaccination(type, dateIso, product, clinic, nextIso) {
    if (!type.trim()) return null;
    state.vaccinations.unshift({
      type: type.trim(),
      date: dateIso,
      product: product.trim(),
      batch: "",
      clinic: clinic.trim(),
      next: nextIso
    });
    state.timeline.unshift({
      date: dateIso,
      kind: "vaccine",
      title: "Вакцинация: " + type.trim(),
      text: product.trim(),
      tone: "mute"
    });
    pushActivity("вакцинация: " + type.trim(), state.me);
    save();
    emit();
    return true;
  }

  function addEvent(kind, title, text) {
    if (!title.trim()) return null;
    state.timeline.unshift({
      date: new Date().toISOString().slice(0, 10),
      kind: kind,
      title: title.trim(),
      text: text.trim(),
      tone: kind === "symptom" ? "coral" : "teal"
    });
    pushActivity("запись: " + title.trim(), state.me);
    save();
    emit();
    return true;
  }

  function updatePet(name, breed, chip, allergies) {
    if (name.trim()) state.pet.name = name.trim();
    state.pet.breed = breed.trim();
    state.pet.chip = chip.trim();
    state.pet.allergies = allergies.trim();
    save();
    emit();
  }

  /* --- сеть и синхронизация ----------------------------- */

  function setOnline(on) {
    state.settings.online = on;
    var synced = 0;
    if (on) {
      state.tasks.forEach(function (t) {
        if (!t.synced) {
          t.synced = true;
          synced += 1;
        }
      });
    }
    save();
    emit();
    return synced;
  }

  function setTheme(theme) {
    state.settings.theme = theme;
    save();
    emit();
  }

  function toggleNotif(key) {
    state.settings.notif[key] = !state.settings.notif[key];
    save();
    emit();
    return state.settings.notif[key];
  }

  /* --- имитация действий второго участника -------------- */

  /** Дима отмечает ближайшую невыполненную задачу — как будто со своего телефона. */
  function simulatePartner() {
    var pending = state.tasks
      .filter(function (t) {
        return t.status === "planned";
      })
      .sort(function (a, b) {
        return a.plannedAt - b.plannedAt;
      })[0];

    if (!pending) return null;
    complete(pending.id, "m2");
    return pending;
  }

  /**
   * Конфликт при офлайне: Дима отметил задачу на несколько минут раньше,
   * его операция доходит до сервера позже. Побеждает время фактического
   * действия, а не время доставки.
   */
  function simulateConflict() {
    var target = state.tasks
      .filter(function (t) {
        return t.status === "planned";
      })
      .sort(function (a, b) {
        return a.plannedAt - b.plannedAt;
      })[0];

    if (!target) return null;

    var mineAt = Date.now();
    var hisAt = mineAt - 4 * MINUTE;

    target.status = "done";
    target.completedBy = "m2";
    target.completedAt = hisAt;
    target.synced = true;

    if (target.courseId) {
      state.course.takenCount += 1;
      state.course.plannedCount += 1;
      state.doseHistory.unshift({ day: "Сегодня", time: hhmm(hisAt), by: "m2", status: "ok" });
    }

    pushActivity("отметка: " + target.title, "m2", hisAt);
    save();
    emit();

    return { task: target, mineAt: mineAt, hisAt: hisAt, by: member("m2") };
  }

  /* --- отчёт для ветеринара ----------------------------- */

  function buildReport(days) {
    var w = state.weights;
    var last = w[w.length - 1];
    var first = w[0];
    var skips = state.doseHistory.filter(function (d) {
      return d.status === "skip";
    }).length;

    return {
      period: days,
      pet: state.pet.name,
      generatedAt: Date.now(),
      rows: [
        { k: "Препарат", v: state.course.drug + ", " + state.course.doseText },
        { k: "Режим приёма", v: state.course.frequency },
        { k: "Принято", v: state.course.takenCount + " из " + state.course.plannedCount },
        { k: "Пропусков", v: skips + " " + plural(skips, "приём", "приёма", "приёмов") },
        { k: "Вес сейчас", v: String(last.kg).replace(".", ",") + " кг" },
        {
          k: "Динамика веса",
          v: (last.kg - first.kg >= 0 ? "+" : "−") +
            String(Math.abs(last.kg - first.kg).toFixed(1)).replace(".", ",") +
            " кг за период наблюдения"
        },
        { k: "Симптомы", v: "Зуд за ухом: 18–22 июля, интенсивность 3 из 5" },
        { k: "Вакцинации", v: "Бешенство — действует до 4 мая 2027" }
      ]
    };
  }

  /* --- статус вакцинации -------------------------------- */

  function vaccineStatus(v) {
    var days = daysBetween(new Date(), v.next);
    if (days < 0) return { kind: "late", label: "Просрочено на " + Math.abs(days) + " " + plural(Math.abs(days), "день", "дня", "дней") };
    if (days <= 30) return { kind: "warn", label: "Через " + days + " " + plural(days, "день", "дня", "дней") };
    return { kind: "ok", label: "Действует" };
  }

  /* --- инициализация ------------------------------------ */

  state = load();

  global.Store = {
    get state() {
      return state;
    },
    subscribe: subscribe,
    save: save,
    reset: reset,
    member: member,
    me: me,
    taskById: taskById,
    sections: sections,
    progress: progress,
    unsyncedCount: unsyncedCount,
    activeToday: activeToday,
    complete: complete,
    undo: undo,
    skip: skip,
    snooze: snooze,
    addTask: addTask,
    deleteTask: deleteTask,
    addCourse: addCourse,
    addWeight: addWeight,
    addVaccination: addVaccination,
    addEvent: addEvent,
    updatePet: updatePet,
    parseTimeToday: parseTimeToday,
    setOnline: setOnline,
    setTheme: setTheme,
    toggleNotif: toggleNotif,
    simulatePartner: simulatePartner,
    simulateConflict: simulateConflict,
    buildReport: buildReport,
    vaccineStatus: vaccineStatus,
    hhmm: hhmm,
    dateRu: dateRu,
    daysBetween: daysBetween,
    plural: plural
  };
})(window);
