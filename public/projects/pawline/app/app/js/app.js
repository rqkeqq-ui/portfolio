/* ============================================================
   PAWLINE — интерфейс прототипа
   ============================================================ */
(function (global) {
  "use strict";

  var S = global.Store;
  var screenEl, tabbarEl, sheetEl, toastEl, appbarEl;
  var currentTab = "today";
  var undoTimer = null;

  /* --- helpers ------------------------------------------ */

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ava(m, big) {
    if (!m) return "";
    return (
      '<span class="ava ava-' + m.color + (big ? " ava--lg" : "") + '">' + esc(m.initial) + "</span>"
    );
  }

  var TYPE_ICON = {
    food: "ti-bowl-spoon",
    med: "ti-pill",
    walk: "ti-walk",
    care: "ti-scissors",
    weight: "ti-scale"
  };

  var TYPE_NAME = {
    food: "Кормление",
    med: "Лекарство",
    walk: "Прогулка",
    care: "Уход",
    weight: "Показатели"
  };

  var ROLE_NAME = {
    owner: "Владелец",
    member: "Участник",
    limited: "Ограниченный",
    sitter: "Ситтер"
  };

  function relTime(ts) {
    var diff = Math.round((Date.now() - ts) / 60000);
    if (diff < 1) return "только что";
    if (diff < 60) return diff + " мин назад";
    return S.hhmm(ts);
  }

  /* --- toast -------------------------------------------- */

  function toast(opts) {
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<i class="ti ' + (opts.icon || "ti-info-circle") + '" aria-hidden="true"></i>' +
      '<div class="toast-text">' + esc(opts.text) + "</div>" +
      (opts.action ? '<button class="toast-action" type="button">' + esc(opts.action) + "</button>" : "");

    toastEl.appendChild(el);

    var life = opts.duration || 4000;
    var timer = setTimeout(dismiss, life);

    function dismiss() {
      clearTimeout(timer);
      el.classList.add("is-out");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    }

    if (opts.action) {
      el.querySelector(".toast-action").addEventListener("click", function () {
        dismiss();
        if (opts.onAction) opts.onAction();
      });
    }

    return dismiss;
  }

  /* --- bottom sheet ------------------------------------- */

  function openSheet(html) {
    sheetEl.innerHTML = '<div class="sheet"><div class="sheet-grab"></div>' + html + "</div>";
    sheetEl.classList.add("is-open");
  }

  function closeSheet() {
    sheetEl.classList.remove("is-open");
    sheetEl.innerHTML = "";
  }

  /* --- экран «Сегодня» ---------------------------------- */

  function taskCard(t) {
    var cls = "task";
    var now = Date.now();
    var isLate = t.status === "planned" && t.plannedAt < now;
    if (t.status === "done") cls += " task--done";
    else if (t.status === "skipped") cls += " task--skipped";
    else if (isLate) cls += " task--late";

    var doneBy = t.completedBy ? S.member(t.completedBy) : null;

    var meta = "";
    if (t.status === "done" && doneBy) {
      meta =
        '<div class="task-meta">' + ava(doneBy) + esc(doneBy.name) + " · " + S.hhmm(t.completedAt) +
        (t.synced ? "" : ' <span class="unsynced"><i class="ti ti-cloud-off" aria-hidden="true"></i>не отправлено</span>') +
        "</div>";
    } else if (t.status === "skipped") {
      meta =
        '<div class="task-meta"><i class="ti ti-player-skip-forward" aria-hidden="true"></i>Пропущено — ' +
        esc(t.skipReason || "без причины") + "</div>";
    } else {
      meta =
        '<div class="task-type"><i class="ti ' + TYPE_ICON[t.type] + '" aria-hidden="true"></i>' +
        esc(TYPE_NAME[t.type]) + (t.detail ? " · " + esc(t.detail) : "") + "</div>";
    }

    return (
      '<div class="' + cls + '" data-task-id="' + t.id + '">' +
        '<button class="check" type="button" data-act="toggle" data-id="' + t.id + '" ' +
          'aria-label="' + (t.status === "planned" ? "Отметить: " : "Выполнено: ") + esc(t.title) + '">' +
          '<i class="ti ' + (t.status === "skipped" ? "ti-minus" : "ti-check") + '" aria-hidden="true"></i>' +
        "</button>" +
        '<button class="task-main" type="button" data-act="details" data-id="' + t.id + '">' +
          '<div class="task-row">' +
            '<span class="task-title">' + esc(t.title) + "</span>" +
            '<span class="task-time' + (isLate ? " task-time--late" : "") + '">' + S.hhmm(t.plannedAt) + "</span>" +
          "</div>" + meta +
        "</button>" +
      "</div>"
    );
  }

  function renderToday() {
    var st = S.state;
    var sec = S.sections();
    var pr = S.progress();
    var actives = S.activeToday();
    var html = "";

    if (!st.settings.online) {
      html +=
        '<div class="banner banner--offline"><i class="ti ti-wifi-off" aria-hidden="true"></i>' +
        "Нет сети. Отметки сохраняются и отправятся, когда связь появится.</div>";
    }

    html +=
      '<div class="progress">' +
        '<div class="progress-top">' +
          '<div class="progress-num">' + pr.done + ' <span>из ' + pr.total + " задач</span></div>" +
          '<div class="ava-stack">' + actives.map(function (m) { return ava(m); }).join("") + "</div>" +
        "</div>" +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pr.percent + '%"></div></div>' +
      "</div>";

    if (st.members.length < 2) {
      html +=
        '<div class="invite" style="margin-top:12px"><b>Пока вы один</b>' +
        "<p>Приложение станет полезнее, когда подключится второй человек — тогда каждый видит, что уже сделано.</p>" +
        '<button class="btn btn--primary" type="button" data-act="invite">Пригласить</button></div>';
    }

    function block(label, list, mod) {
      if (!list.length) return "";
      return (
        '<div class="sec-label' + (mod || "") + '">' + esc(label) +
        '<span class="sec-count">' + list.length + "</span></div>" +
        list.map(taskCard).join("")
      );
    }

    html += block("Просрочено", sec.late, " sec-label--late");
    html += block("Сейчас", sec.now);
    html += block("Дальше сегодня", sec.next);
    html += block("Выполнено", sec.done);

    if (!sec.late.length && !sec.now.length && !sec.next.length) {
      html +=
        '<div class="empty"><i class="ti ti-check" aria-hidden="true"></i>' +
        "<b>На сегодня всё</b><p>Следующая задача — завтра утром.</p></div>";
    }

    if (st.activity.length) {
      html += '<div class="sec-label">Активность семьи</div><ul class="feed">';
      html += st.activity.slice(0, 5).map(function (a) {
        var m = S.member(a.by);
        return (
          "<li>" + ava(m) + "<span><b>" + esc(m ? m.name : "") + "</b> · " + esc(a.text) + "</span>" +
          "<time>" + relTime(a.at) + "</time></li>"
        );
      }).join("");
      html += "</ul>";
    }

    return html;
  }

  /* --- экран «Здоровье» --------------------------------- */

  function weightChart() {
    var w = S.state.weights;
    var vals = w.map(function (p) { return p.kg; });
    var min = Math.min.apply(null, vals) - 0.6;
    var max = Math.max.apply(null, vals) + 0.6;
    var W = 320, H = 130, pad = 10;

    var pts = w.map(function (p, i) {
      var x = pad + (i * (W - pad * 2)) / (w.length - 1);
      var y = H - pad - ((p.kg - min) / (max - min)) * (H - pad * 2);
      return [Math.round(x), Math.round(y)];
    });

    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    var area = line + " L" + pts[pts.length - 1][0] + " " + (H - pad) + " L" + pts[0][0] + " " + (H - pad) + " Z";

    return (
      '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="График веса за 7 измерений">' +
        '<path d="' + area + '" fill="var(--teal-tint)"/>' +
        '<path d="' + line + '" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        pts.map(function (p, i) {
          var isLast = i === pts.length - 1;
          return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (isLast ? 5 : 3) + '" fill="var(--teal)" ' +
            (isLast ? 'stroke="var(--card)" stroke-width="2"' : "") + "/>";
        }).join("") +
      "</svg>"
    );
  }

  function renderHealth() {
    var st = S.state;
    var c = st.course;
    var w = st.weights;
    var last = w[w.length - 1];
    var delta = (last.kg - w[0].kg).toFixed(1).replace(".", ",");

    var cells = "";
    for (var d = 1; d <= c.totalDays; d++) {
      var cls = d < c.currentDay ? "done" : d === c.currentDay ? "today" : "";
      cells += '<i class="' + cls + '"></i>';
    }

    var html =
      '<div class="screen-title">Здоровье</div>' +
      '<div class="screen-sub">' + esc(st.pet.name) + " · вся история в одном месте</div>";

    // курс лекарств
    html +=
      '<div class="card">' +
        '<div class="card-head"><h3>' + esc(c.drug) + " " + esc(c.doseText.split(",")[0]) + "</h3>" +
          '<span class="pill pill--ok">День ' + c.currentDay + " из " + c.totalDays + "</span></div>" +
        '<div class="card-sub">' + esc(c.frequency) + "</div>" +
        '<div class="course-grid">' + cells + "</div>" +
        '<div class="chart-legend"><span>Принято ' + c.takenCount + " из " + c.plannedCount + "</span>" +
        "<span>до " + S.dateRu("2026-08-05") + "</span></div>" +
        '<div class="note" style="margin-top:12px"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
        "<span>Дозировка введена со слов врача: " + esc(c.prescribedBy) +
        ". Приложение не рассчитывает и не проверяет дозы.</span></div>" +
      "</div>";

    // история приёмов
    html += '<div class="sec-label">История приёмов</div><div class="card">';
    html += st.doseHistory.slice(0, 6).map(function (h) {
      var m = S.member(h.by);
      return (
        '<div class="list-row">' +
          '<span class="dot dot--' + (h.status === "ok" ? "ok" : "skip") + '"></span>' +
          '<div class="list-row-main"><b>' + esc(h.day) + " · " + esc(h.time) + "</b>" +
          "<span>" + (h.status === "ok" ? "Принято" : "Пропуск — " + esc(h.reason)) + "</span></div>" +
          ava(m) +
        "</div>"
      );
    }).join("");
    html += "</div>";

    // вакцинации
    html += '<div class="sec-label">Вакцинации</div><div class="card">';
    html += st.vaccinations.map(function (v) {
      var s = S.vaccineStatus(v);
      return (
        '<div class="list-row">' +
          '<div class="list-row-main"><b>' + esc(v.type) + "</b>" +
          "<span>" + S.dateRu(v.date) + " · следующая " + S.dateRu(v.next) + "</span></div>" +
          '<span class="pill pill--' + s.kind + '">' + esc(s.label) + "</span>" +
        "</div>"
      );
    }).join("");
    html += "</div>";

    // вес
    html +=
      '<div class="sec-label">Вес</div>' +
      '<div class="card">' +
        '<div class="card-head"><h3>' + String(last.kg).replace(".", ",") + " кг</h3>" +
        '<span class="pill pill--mute">' + (last.kg >= w[0].kg ? "+" : "−") + delta.replace("-", "") + " кг за 6 мес.</span></div>" +
        weightChart() +
        '<div class="chart-legend"><span>' + S.dateRu(w[0].date) + "</span><span>" + S.dateRu(last.date) + "</span></div>" +
        '<div class="note" style="margin-top:10px"><i class="ti ti-target" aria-hidden="true"></i>' +
        "<span>Целевой диапазон " + st.weightTarget.min + "–" + st.weightTarget.max +
        " кг указан владельцем со слов врача.</span></div>" +
      "</div>";

    // временная шкала
    html += '<div class="sec-label">Временная шкала</div><div class="card"><ul class="timeline">';
    html += st.timeline.map(function (e) {
      return (
        '<li class="tl-' + e.tone + '"><b>' + esc(e.title) + "</b>" +
        "<span>" + S.dateRu(e.date) + "</span>" +
        (e.text ? "<p>" + esc(e.text) + "</p>" : "") + "</li>"
      );
    }).join("");
    html += "</ul></div>";

    html +=
      '<button class="btn btn--primary" type="button" data-act="report" style="margin-top:6px">' +
      '<i class="ti ti-file-text" aria-hidden="true"></i>Собрать отчёт для ветеринара</button>';

    return html;
  }

  /* --- экран «Питомец» ---------------------------------- */

  function qrGrid(size) {
    // Детерминированный псевдо-QR: узор зависит только от индекса ячейки.
    var cells = "";
    for (var i = 0; i < size * size; i++) {
      var r = Math.floor(i / size), c = i % size;
      var finder =
        (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
      var on = finder || ((r * 7 + c * 13 + ((r * c) % 5)) % 3 === 0);
      cells += '<i class="' + (on ? "on" : "") + '"></i>';
    }
    return '<div class="qr" style="grid-template-columns:repeat(' + size + ',1fr)" aria-hidden="true">' + cells + "</div>";
  }

  function renderPet() {
    var st = S.state;
    var p = st.pet;
    var age = S.daysBetween(p.birth, new Date());
    var years = Math.floor(age / 365);

    var html =
      '<div class="screen-title">' + esc(p.name) + "</div>" +
      '<div class="screen-sub">' + esc(p.breed) + " · " + years + " " + S.plural(years, "год", "года", "лет") + "</div>";

    html +=
      '<div class="card">' +
        '<div class="kv"><span>Вид</span><b>' + esc(p.species) + "</b></div>" +
        '<div class="kv"><span>Пол</span><b>' + esc(p.sex) + (p.neutered ? ", кастрирован" : "") + "</b></div>" +
        '<div class="kv"><span>Дата рождения</span><b>' + S.dateRu(p.birth) + "</b></div>" +
        '<div class="kv"><span>Чип</span><b>' + esc(p.chip) + "</b></div>" +
        '<div class="kv"><span>Особенности</span><b>' + esc(p.allergies) + "</b></div>" +
      "</div>";

    html += '<div class="sec-label">Инструкции по уходу</div><div class="card">';
    html += p.care.map(function (c) {
      return '<div class="kv"><span>' + esc(c.k) + "</span><b>" + esc(c.v) + "</b></div>";
    }).join("");
    html += "</div>";
    html +=
      '<div class="note" style="margin-bottom:10px"><i class="ti ti-users" aria-hidden="true"></i>' +
      "<span>Именно этот раздел открывает ситтер — держите его в актуальном состоянии.</span></div>";

    html += '<div class="sec-label">Документы<span class="sec-count">' + st.documents.length + "</span></div>";
    html += '<div class="doc-grid">';
    html += '<button class="doc doc--add" type="button" data-act="scan"><i class="ti ti-camera-plus" aria-hidden="true"></i>Снять документ</button>';
    html += st.documents.map(function (d) {
      return (
        '<div class="doc">' + (d.pinned ? '<i class="ti ti-pin-filled doc-pin" title="Доступен офлайн"></i>' : "") +
        '<i class="ti ' + d.icon + '" aria-hidden="true"></i>' + esc(d.name) + "</div>"
      );
    }).join("");
    html += "</div>";

    html += '<div class="sec-label">Экстренная карточка</div>';
    html +=
      '<div class="card" style="text-align:center">' +
        qrGrid(11) +
        '<div class="card-sub" style="margin-top:12px">Кличка, чип, особенности и контакты. ' +
        "Открывается без приложения и работает офлайн.</div>" +
        '<button class="btn btn--ghost" type="button" data-act="emergency" style="margin-top:12px">' +
        '<i class="ti ti-eye" aria-hidden="true"></i>Посмотреть карточку</button>' +
      "</div>";

    html += '<div class="sec-label">Контакты</div><div class="card">';
    html += st.contacts.map(function (c) {
      return (
        '<div class="list-row"><div class="list-row-main"><b>' + esc(c.name) + "</b>" +
        "<span>" + esc(c.kind) + " · " + esc(c.phone) + "</span></div>" +
        '<i class="ti ti-phone" style="font-size:19px;color:var(--teal)" aria-hidden="true"></i></div>'
      );
    }).join("");
    html += "</div>";

    html +=
      '<button class="btn btn--ghost" type="button" data-act="archive" style="margin-top:6px">' +
      '<i class="ti ti-archive" aria-hidden="true"></i>Архивировать профиль</button>';

    return html;
  }

  /* --- экран «Семья» ------------------------------------ */

  function renderFamily() {
    var st = S.state;
    var n = st.settings.notif;

    var html =
      '<div class="screen-title">Семья</div>' +
      '<div class="screen-sub">' + st.members.length + " " + S.plural(st.members.length, "участник", "участника", "участников") +
      " · доступ к " + esc(st.pet.name) + "</div>";

    html += '<div class="card">';
    html += st.members.map(function (m) {
      var extra = m.role === "sitter" ? "до " + S.dateRu(m.expires) : ROLE_NAME[m.role];
      return (
        '<div class="member">' + ava(m, true) +
        '<div class="member-main"><b>' + esc(m.name) + (m.id === st.me ? " · это вы" : "") + "</b>" +
        "<span>" + esc(extra) + "</span></div>" +
        '<span class="pill pill--' + (m.role === "sitter" ? "warn" : "mute") + '">' + esc(ROLE_NAME[m.role]) + "</span>" +
        "</div>"
      );
    }).join("");
    html += "</div>";

    html +=
      '<button class="btn btn--primary" type="button" data-act="invite" style="margin-bottom:8px">' +
      '<i class="ti ti-user-plus" aria-hidden="true"></i>Пригласить участника</button>' +
      '<button class="btn btn--ghost" type="button" data-act="sitter">' +
      '<i class="ti ti-key" aria-hidden="true"></i>Настроить режим ситтера</button>';

    html += '<div class="sec-label">Мои уведомления</div><div class="card">';
    html += [
      { k: "med", t: "Лекарства", s: "Отключить нельзя — можно перенести время", lock: true },
      { k: "food", t: "Кормление", s: "Напоминания о порциях" },
      { k: "walk", t: "Прогулки", s: "Утро и вечер" },
      { k: "info", t: "Действия других", s: "«Дима отметил корм» — по умолчанию выключено" },
      { k: "quiet", t: "Тихие часы", s: "С 23:00 до 07:00, кроме лекарств" }
    ].map(function (row) {
      return (
        '<div class="switch-row"><div class="switch-main"><b>' + esc(row.t) + "</b><span>" + esc(row.s) + "</span></div>" +
        '<button class="switch' + (n[row.k] ? " is-on" : "") + '" type="button" role="switch" ' +
        'aria-checked="' + (n[row.k] ? "true" : "false") + '" aria-label="' + esc(row.t) + '" ' +
        (row.lock ? "disabled" : 'data-act="notif" data-key="' + row.k + '"') + "></button></div>"
      );
    }).join("");
    html += "</div>";

    html +=
      '<div class="note"><i class="ti ti-bell-cog" aria-hidden="true"></i>' +
      "<span>Уведомление снимается у всех сразу после первой отметки — поэтому второй человек " +
      "не увидит напоминания о том, что уже сделано.</span></div>";

    html += '<div class="sec-label">Журнал действий</div><div class="card">';
    if (!st.activity.length) {
      html += '<div class="card-sub">Пока пусто. Отметьте задачу — здесь появится запись.</div>';
    } else {
      html += st.activity.map(function (a) {
        var m = S.member(a.by);
        return (
          '<div class="list-row">' + ava(m) +
          '<div class="list-row-main"><b>' + esc(m ? m.name : "") + " · " + esc(a.text) + "</b>" +
          "<span>" + relTime(a.at) + "</span></div></div>"
        );
      }).join("");
    }
    html += "</div>";

    return html;
  }

  /* --- шиты --------------------------------------------- */

  function sheetTaskDetails(id) {
    var t = S.taskById(id);
    if (!t) return;
    var doneBy = t.completedBy ? S.member(t.completedBy) : null;

    var html =
      "<h3>" + esc(t.title) + "</h3>" +
      '<div class="sheet-sub">' + esc(TYPE_NAME[t.type]) + (t.detail ? " · " + esc(t.detail) : "") +
      " · план " + S.hhmm(t.plannedAt) + "</div>";

    if (t.instruction) {
      html += '<div class="note" style="margin-bottom:14px"><i class="ti ti-notes" aria-hidden="true"></i><span>' +
        esc(t.instruction) + "</span></div>";
    }

    if (t.status === "done" && doneBy) {
      html +=
        '<div class="card" style="margin-bottom:12px"><div class="list-row">' + ava(doneBy, true) +
        '<div class="list-row-main"><b>Отметка — ' + esc(doneBy.name) + "</b><span>" +
        S.hhmm(t.completedAt) + (t.synced ? " · синхронизировано" : " · ждёт отправки") + "</span></div></div></div>";
      html += '<button class="btn btn--ghost" type="button" data-act="undo" data-id="' + t.id + '">' +
        '<i class="ti ti-arrow-back-up" aria-hidden="true"></i>Отменить отметку</button>';
    } else if (t.status === "skipped") {
      html +=
        '<div class="note" style="margin-bottom:12px"><i class="ti ti-player-skip-forward" aria-hidden="true"></i>' +
        "<span>Пропущено: " + esc(t.skipReason) + "</span></div>" +
        '<button class="btn btn--ghost" type="button" data-act="undo" data-id="' + t.id + '">' +
        "<i class=\"ti ti-arrow-back-up\" aria-hidden=\"true\"></i>Вернуть в список</button>";
    } else {
      html +=
        '<button class="btn btn--primary" type="button" data-act="toggle" data-id="' + t.id + '">' +
        '<i class="ti ti-check" aria-hidden="true"></i>Отметить выполненным</button>' +
        '<button class="btn btn--ghost" type="button" data-act="snooze" data-id="' + t.id + '">' +
        '<i class="ti ti-clock" aria-hidden="true"></i>Отложить на 15 минут</button>' +
        '<button class="btn btn--ghost" type="button" data-act="skip-ask" data-id="' + t.id + '">' +
        '<i class="ti ti-player-skip-forward" aria-hidden="true"></i>Пропустить с причиной</button>' +
        '<button class="btn btn--danger" type="button" data-act="delete-task" data-id="' + t.id + '">' +
        '<i class="ti ti-trash" aria-hidden="true"></i>Удалить задачу</button>';
    }

    openSheet(html);
  }

  var SKIP_REASONS = [
    { t: "Выплюнул", i: "ti-mood-empty" },
    { t: "Отказался есть", i: "ti-bowl-spoon" },
    { t: "Забыли", i: "ti-clock-x" },
    { t: "Отменено врачом", i: "ti-stethoscope" },
    { t: "Закончился препарат", i: "ti-package-off" }
  ];

  function sheetSkip(id) {
    var html =
      "<h3>Почему пропущено?</h3>" +
      '<div class="sheet-sub">Причина попадёт в отчёт для врача — это то, о чём он спросит.</div>' +
      '<div class="sheet-list">' +
      SKIP_REASONS.map(function (r) {
        return (
          '<button class="sheet-opt" type="button" data-act="skip-do" data-id="' + id + '" data-reason="' + esc(r.t) + '">' +
          '<i class="ti ' + r.i + '" aria-hidden="true"></i>' + esc(r.t) + "</button>"
        );
      }).join("") +
      "</div>";
    openSheet(html);
  }

  function sheetReport() {
    var rep = S.buildReport(30);
    var html =
      "<h3>Отчёт для ветеринара</h3>" +
      '<div class="sheet-sub">Период: последние 30 дней · ' + esc(rep.pet) + "</div>" +
      '<div class="card">' +
      rep.rows.map(function (r) {
        return '<div class="kv"><span>' + esc(r.k) + "</span><b>" + esc(r.v) + "</b></div>";
      }).join("") +
      "</div>" +
      '<div class="note" style="margin-bottom:12px"><i class="ti ti-shield-check" aria-hidden="true"></i>' +
      "<span>Отчёт содержит только факты: что и когда происходило. Никаких выводов и рекомендаций — " +
      "их делает врач.</span></div>" +
      '<button class="btn btn--primary" type="button" data-act="report-save">' +
      '<i class="ti ti-download" aria-hidden="true"></i>Сохранить PDF и отправить</button>';
    openSheet(html);
  }

  function sheetEmergency() {
    var p = S.state.pet;
    var html =
      "<h3>Экстренная карточка</h3>" +
      '<div class="sheet-sub">Так её увидит человек, нашедший питомца</div>' +
      '<div class="card">' +
        '<div class="card-title">' + esc(p.name) + "</div>" +
        '<div class="card-sub" style="margin-bottom:10px">' + esc(p.species) + " · " + esc(p.breed) + "</div>" +
        '<div class="kv"><span>Чип</span><b>' + esc(p.chip) + "</b></div>" +
        '<div class="kv"><span>Особенности</span><b>' + esc(p.allergies) + "</b></div>" +
        '<div class="kv"><span>Лекарства</span><b>Апоквел 16 мг, ежедневно</b></div>' +
        '<div class="kv"><span>Маша</span><b>+7 916 000-11-22</b></div>' +
        '<div class="kv"><span>Дима</span><b>+7 916 000-33-44</b></div>' +
        '<div class="kv"><span>Клиника</span><b>Био-Вет, +7 495 000-11-22</b></div>' +
      "</div>" +
      '<div class="note" style="margin-bottom:12px"><i class="ti ti-scan" aria-hidden="true"></i>' +
      "<span>Каждое сканирование записывается в журнал. При включённом режиме потери " +
      "приходит уведомление с местом сканирования.</span></div>" +
      '<button class="btn btn--danger" type="button" data-act="lost">' +
      '<i class="ti ti-alert-triangle" aria-hidden="true"></i>Включить режим «Питомец потерян»</button>';
    openSheet(html);
  }

  function sheetInvite() {
    var html =
      "<h3>Пригласить участника</h3>" +
      '<div class="sheet-sub">Выберите роль — от неё зависит, что человек увидит</div>' +
      '<div class="sheet-list">' +
        '<button class="sheet-opt is-picked" type="button"><i class="ti ti-user-check" aria-hidden="true"></i>' +
        "<span><b>Участник</b><br><span style=\"font-size:12.5px;color:var(--ink-3)\">Всё, кроме удаления и подписки</span></span></button>" +
        '<button class="sheet-opt" type="button"><i class="ti ti-user-shield" aria-hidden="true"></i>' +
        "<span><b>Ограниченный</b><br><span style=\"font-size:12.5px;color:var(--ink-3)\">Задачи без медицинских данных — для детей</span></span></button>" +
        '<button class="sheet-opt" type="button"><i class="ti ti-key" aria-hidden="true"></i>' +
        "<span><b>Ситтер</b><br><span style=\"font-size:12.5px;color:var(--ink-3)\">Только задачи на период и инструкции</span></span></button>" +
      "</div>" +
      '<button class="btn btn--primary" type="button" data-act="invite-copy">' +
      '<i class="ti ti-link" aria-hidden="true"></i>Скопировать ссылку-приглашение</button>';
    openSheet(html);
  }

  function sheetSitter() {
    var html =
      "<h3>Режим ситтера</h3>" +
      '<div class="sheet-sub">Костя · доступ до 12 августа 2026</div>' +
      '<div class="card">' +
        '<div class="list-row"><div class="list-row-main"><b>Задачи на период</b><span>Видит и может отмечать</span></div>' +
        '<i class="ti ti-eye" style="font-size:19px;color:var(--teal)" aria-hidden="true"></i></div>' +
        '<div class="list-row"><div class="list-row-main"><b>Инструкции по уходу</b><span>Корм, прогулки, особенности</span></div>' +
        '<i class="ti ti-eye" style="font-size:19px;color:var(--teal)" aria-hidden="true"></i></div>' +
        '<div class="list-row"><div class="list-row-main"><b>Экстренные контакты</b><span>Клиника и владельцы</span></div>' +
        '<i class="ti ti-eye" style="font-size:19px;color:var(--teal)" aria-hidden="true"></i></div>' +
        '<div class="list-row"><div class="list-row-main"><b>История болезни</b><span>Скрыто</span></div>' +
        '<i class="ti ti-eye-off" style="font-size:19px;color:var(--ink-3)" aria-hidden="true"></i></div>' +
        '<div class="list-row"><div class="list-row-main"><b>Документы</b><span>Скрыто</span></div>' +
        '<i class="ti ti-eye-off" style="font-size:19px;color:var(--ink-3)" aria-hidden="true"></i></div>' +
      "</div>" +
      '<div class="note"><i class="ti ti-clock-off" aria-hidden="true"></i>' +
      "<span>Доступ отключится автоматически в указанную дату. Отзывать вручную не нужно.</span></div>";
    openSheet(html);
  }

  /* --- формы создания ----------------------------------- */

  function field(id, label, placeholder, opts) {
    var o = opts || {};
    return (
      '<label style="display:block;margin-bottom:10px">' +
        '<span style="display:block;font-size:12px;color:var(--ink-3);margin-bottom:4px">' + esc(label) + "</span>" +
        '<input id="' + id + '" type="' + (o.type || "text") + '" placeholder="' + esc(placeholder || "") + '" ' +
        'value="' + esc(o.value || "") + '" ' +
        'style="width:100%;padding:11px 13px;font-size:15px;border:1px solid var(--line-2);' +
        "border-radius:10px;background:var(--card);color:var(--ink)\">" +
        (o.hint ? '<span style="display:block;font-size:11.5px;color:var(--ink-3);margin-top:4px">' + esc(o.hint) + "</span>" : "") +
      "</label>"
    );
  }

  function formActions(submitLabel, act) {
    return (
      '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn btn--ghost" type="button" data-act="close-sheet" style="flex:1">Отмена</button>' +
        '<button class="btn btn--primary" type="button" data-act="' + act + '" style="flex:1.4">' + esc(submitLabel) + "</button>" +
      "</div>"
    );
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function sheetAddMenu() {
    var items = [
      ["add-task", "ti-checkbox", "Задачу", "Кормление, прогулка, процедура"],
      ["add-course", "ti-pill", "Курс лекарств", "Создаст приёмы в задачах"],
      ["add-vaccine", "ti-vaccine", "Вакцинацию", "С датой ревакцинации"],
      ["add-weight", "ti-scale", "Запись веса", "Точка на графике"],
      ["add-event", "ti-notes", "Симптом или событие", "На временную шкалу"],
      ["edit-pet", "ti-dog", "Изменить профиль", "Кличка, порода, чип"]
    ];
    openSheet(
      "<h3>Что добавить?</h3>" +
      '<div class="sheet-list" style="margin-top:12px">' +
      items.map(function (i) {
        return (
          '<button class="sheet-opt" type="button" data-act="open-' + i[0] + '">' +
          '<i class="ti ' + i[1] + '" aria-hidden="true"></i>' +
          "<span><b>" + esc(i[2]) + "</b><br>" +
          '<span style="font-size:12px;color:var(--ink-3)">' + esc(i[3]) + "</span></span></button>"
        );
      }).join("") + "</div>"
    );
  }

  function sheetAddTask() {
    openSheet(
      "<h3>Новая задача</h3><div class=\"sheet-sub\">Разовая — на сегодня</div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="taskTypes">' +
      [["food", "Кормление"], ["walk", "Прогулка"], ["care", "Уход"], ["weight", "Взвешивание"]]
        .map(function (t, i) {
          return '<button class="tag" type="button" data-type="' + t[0] + '" ' +
            'style="border:1px solid ' + (i === 0 ? "var(--coral)" : "transparent") + '">' + t[1] + "</button>";
        }).join("") + "</div>" +
      field("taskTitle", "Название", "Вечерний корм") +
      field("taskDetail", "Детали", "120 г сухого") +
      field("taskTime", "Время", "19:00", { hint: "Формат ЧЧ:ММ" }) +
      formActions("Добавить", "save-task")
    );
    var box = document.getElementById("taskTypes");
    box.dataset.picked = "food";
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-type]");
      if (!b) return;
      box.dataset.picked = b.dataset.type;
      Array.prototype.forEach.call(box.children, function (child) {
        child.style.border = "1px solid transparent";
      });
      b.style.border = "1px solid var(--coral)";
    });
  }

  function sheetAddCourse() {
    openSheet(
      "<h3>Новый курс лекарств</h3><div class=\"sheet-sub\">Приёмы появятся в задачах автоматически</div>" +
      field("cDrug", "Препарат", "Апоквел") +
      field("cDose", "Дозировка", "16 мг, 1 таблетка", { hint: "Так, как назначил врач" }) +
      field("cTimes", "Время приёмов", "09:00, 21:00", { value: "09:00, 21:00", hint: "Через запятую" }) +
      field("cDays", "Длительность, дней", "21", { type: "number" }) +
      field("cNote", "Заметка", "Прятать в паштет") +
      '<div class="note" style="margin-top:8px"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
      "<span>Приложение не рассчитывает и не проверяет дозировки.</span></div>" +
      formActions("Создать курс", "save-course")
    );
  }

  function sheetAddVaccine() {
    var today = new Date().toISOString().slice(0, 10);
    var next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    openSheet(
      "<h3>Вакцинация</h3><div class=\"sheet-sub\">Дата следующей — ориентировочная</div>" +
      field("vType", "Тип вакцины", "Бешенство") +
      field("vDate", "Дата", "", { type: "date", value: today }) +
      field("vProduct", "Препарат", "Нобивак Rabies") +
      field("vClinic", "Клиника", "Био-Вет") +
      field("vNext", "Следующая", "", { type: "date", value: next.toISOString().slice(0, 10), hint: "Уточните у врача" }) +
      formActions("Записать", "save-vaccine")
    );
  }

  function sheetAddWeight() {
    openSheet(
      "<h3>Запись веса</h3>" +
      field("wKg", "Вес, кг", "18,4", { hint: "Дата — сегодня" }) +
      formActions("Записать", "save-weight")
    );
  }

  function sheetAddEvent() {
    openSheet(
      "<h3>Симптом или событие</h3><div class=\"sheet-sub\">Попадёт на шкалу и в отчёт</div>" +
      '<div style="display:flex;gap:6px;margin-bottom:12px" id="evKinds">' +
        '<button class="tag" type="button" data-kind="symptom" style="border:1px solid var(--coral)">Симптом</button>' +
        '<button class="tag" type="button" data-kind="visit" style="border:1px solid transparent">Визит к врачу</button>' +
      "</div>" +
      field("evTitle", "Что наблюдаете", "Зуд, расчёсы за ухом") +
      field("evText", "Подробности", "Началось вчера вечером") +
      '<div class="note" style="margin-top:8px"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
      "<span>Приложение не подсказывает причины и не ставит диагнозов.</span></div>" +
      formActions("Записать", "save-event")
    );
    var box = document.getElementById("evKinds");
    box.dataset.picked = "symptom";
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kind]");
      if (!b) return;
      box.dataset.picked = b.dataset.kind;
      Array.prototype.forEach.call(box.children, function (child) {
        child.style.border = "1px solid transparent";
      });
      b.style.border = "1px solid var(--coral)";
    });
  }

  function sheetEditPet() {
    var p = S.state.pet;
    openSheet(
      "<h3>Профиль питомца</h3>" +
      field("pName", "Кличка", "", { value: p.name }) +
      field("pBreed", "Порода", "", { value: p.breed }) +
      field("pChip", "Номер чипа", "", { value: p.chip }) +
      field("pAllergies", "Особенности", "", { value: p.allergies }) +
      formActions("Сохранить", "save-pet")
    );
  }

  function sheetDemo() {
    var online = S.state.settings.online;
    var html =
      "<h3>Демо-режим</h3>" +
      '<div class="sheet-sub">Действия, которые в жизни делает второй человек или сеть</div>' +
      '<div class="demo-note">Это прототип: данные хранятся только в вашем браузере, ' +
      "сервера и настоящей синхронизации нет.</div>" +
      '<div class="sheet-list">' +
        '<button class="sheet-opt" type="button" data-act="sim-partner">' +
        '<i class="ti ti-user-check" aria-hidden="true"></i>Дима отмечает ближайшую задачу</button>' +
        '<button class="sheet-opt" type="button" data-act="sim-conflict">' +
        '<i class="ti ti-git-merge" aria-hidden="true"></i>Смоделировать конфликт двух отметок</button>' +
        '<button class="sheet-opt" type="button" data-act="sim-offline">' +
        '<i class="ti ' + (online ? "ti-wifi-off" : "ti-wifi") + '" aria-hidden="true"></i>' +
        (online ? "Уйти в офлайн" : "Вернуть связь и синхронизировать") + "</button>" +
        '<button class="sheet-opt" type="button" data-act="reset">' +
        '<i class="ti ti-refresh" aria-hidden="true"></i>Сбросить данные прототипа</button>' +
      "</div>";
    openSheet(html);
  }

  /* --- рендер ------------------------------------------- */

  var SCREENS = {
    today: renderToday,
    health: renderHealth,
    pet: renderPet,
    family: renderFamily
  };

  function renderAppbar() {
    var st = S.state;
    var unsynced = S.unsyncedCount();
    var dark = st.settings.theme === "dark";

    appbarEl.innerHTML =
      '<button class="pet-btn" type="button" data-act="switch-pet">' +
        '<span class="pet-ava"><i class="ti ti-dog" aria-hidden="true"></i></span>' +
        "<span><span class=\"pet-name\">" + esc(st.pet.name) + "</span>" +
        '<span class="pet-sub">' + (unsynced ? unsynced + " изм. ждут отправки" : "Сегодня") + "</span></span>" +
      "</button>" +
      (st.settings.online
        ? ""
        : '<span class="icon-btn is-on" title="Нет сети"><i class="ti ti-wifi-off" aria-hidden="true"></i></span>') +
      '<button class="icon-btn" type="button" data-act="add-menu" aria-label="Добавить запись">' +
        '<i class="ti ti-plus" aria-hidden="true"></i></button>' +
      '<button class="icon-btn" type="button" data-act="theme" aria-label="Переключить тему">' +
        '<i class="ti ' + (dark ? "ti-sun" : "ti-moon") + '" aria-hidden="true"></i></button>' +
      '<button class="icon-btn" type="button" data-act="demo" aria-label="Демо-режим">' +
        '<i class="ti ti-flask" aria-hidden="true"></i></button>';
  }

  function renderTabbar() {
    var sec = S.sections();
    var late = sec.late.length;
    var tabs = [
      { id: "today", icon: "ti-calendar-check", label: "Сегодня", badge: late },
      { id: "health", icon: "ti-heartbeat", label: "Здоровье" },
      { id: "pet", icon: "ti-dog", label: "Питомец" },
      { id: "family", icon: "ti-users-group", label: "Семья" }
    ];

    tabbarEl.innerHTML = tabs.map(function (t) {
      return (
        '<button class="tab' + (currentTab === t.id ? " is-active" : "") + '" type="button" ' +
        'data-act="tab" data-tab="' + t.id + '" aria-current="' + (currentTab === t.id ? "page" : "false") + '">' +
        '<i class="ti ' + t.icon + '" aria-hidden="true"></i>' +
        (t.badge ? '<span class="tab-badge">' + t.badge + "</span>" : "") +
        "<span>" + t.label + "</span></button>"
      );
    }).join("");
  }

  function render() {
    document.documentElement.setAttribute("data-theme", S.state.settings.theme);
    renderAppbar();
    renderTabbar();
    screenEl.innerHTML = SCREENS[currentTab]();
  }

  /* --- обработка действий ------------------------------- */

  function onToggle(id) {
    var res = S.complete(id);

    if (res.conflict) {
      toast({ icon: "ti-info-circle", text: res.message, duration: 4500 });
      return;
    }

    if (!res.ok) return;

    if (undoTimer) clearTimeout(undoTimer);
    var dismiss = toast({
      icon: res.offline ? "ti-cloud-off" : "ti-check",
      text: res.offline ? "Отмечено. Отправится, когда появится связь" : "Отмечено",
      action: "Отменить",
      duration: 10000,
      onAction: function () {
        S.undo(id);
      }
    });
    undoTimer = setTimeout(function () {}, 0);
    void dismiss;
  }

  function handle(act, el) {
    var id = el.getAttribute("data-id");

    switch (act) {
      case "tab":
        currentTab = el.getAttribute("data-tab");
        screenEl.scrollTop = 0;
        render();
        break;

      case "toggle":
        closeSheet();
        onToggle(id);
        break;

      case "details":
        sheetTaskDetails(id);
        break;

      case "undo":
        S.undo(id);
        closeSheet();
        toast({ icon: "ti-arrow-back-up", text: "Отметка отменена" });
        break;

      case "skip-ask":
        sheetSkip(id);
        break;

      case "skip-do":
        S.skip(id, el.getAttribute("data-reason"));
        closeSheet();
        toast({ icon: "ti-player-skip-forward", text: "Пропуск записан — попадёт в отчёт врачу" });
        break;

      case "snooze":
        S.snooze(id, 15);
        closeSheet();
        toast({ icon: "ti-clock", text: "Отложено на 15 минут" });
        break;

      case "report":
        sheetReport();
        break;

      case "report-save":
        closeSheet();
        toast({ icon: "ti-file-text", text: "В рабочем приложении здесь сохранится PDF" });
        break;

      case "emergency":
        sheetEmergency();
        break;

      case "lost":
        closeSheet();
        toast({ icon: "ti-alert-triangle", text: "Режим потери включён. Уведомим о каждом сканировании", duration: 5000 });
        break;

      case "invite":
        sheetInvite();
        break;

      case "invite-copy":
        closeSheet();
        toast({ icon: "ti-link", text: "Ссылка скопирована. Действует 7 дней" });
        break;

      case "sitter":
        sheetSitter();
        break;

      case "scan":
        toast({ icon: "ti-camera", text: "В рабочем приложении откроется камера в скан-режиме" });
        break;

      case "archive":
        toast({ icon: "ti-archive", text: "Профиль архивируется, а не удаляется. История сохранится", duration: 5000 });
        break;

      case "switch-pet":
        toast({ icon: "ti-dog", text: "Второй питомец доступен в тарифе Family" });
        break;

      case "notif":
        var on = S.toggleNotif(el.getAttribute("data-key"));
        toast({ icon: on ? "ti-bell" : "ti-bell-off", text: on ? "Уведомления включены" : "Уведомления выключены", duration: 2200 });
        break;

      case "theme":
        S.setTheme(S.state.settings.theme === "dark" ? "light" : "dark");
        break;

      case "demo":
        sheetDemo();
        break;

      case "close-sheet":
        closeSheet();
        break;

      case "add-menu":
        sheetAddMenu();
        break;

      case "open-add-task": sheetAddTask(); break;
      case "open-add-course": sheetAddCourse(); break;
      case "open-add-vaccine": sheetAddVaccine(); break;
      case "open-add-weight": sheetAddWeight(); break;
      case "open-add-event": sheetAddEvent(); break;
      case "open-edit-pet": sheetEditPet(); break;

      case "save-task":
        var tType = document.getElementById("taskTypes").dataset.picked;
        var created = S.addTask(tType, val("taskTitle"), val("taskDetail"), val("taskTime"));
        if (!created) {
          toast({ icon: "ti-alert-circle", text: "Заполните название и время в формате ЧЧ:ММ" });
          break;
        }
        closeSheet();
        currentTab = "today";
        render();
        toast({ icon: "ti-check", text: "Задача добавлена на " + S.hhmm(created.plannedAt) });
        break;

      case "save-course":
        var res = S.addCourse(val("cDrug"), val("cDose"), val("cTimes"), val("cDays"), val("cNote"));
        if (!res) {
          toast({ icon: "ti-alert-circle", text: "Проверьте препарат, дозировку, время и длительность" });
          break;
        }
        closeSheet();
        currentTab = "today";
        render();
        toast({
          icon: "ti-pill",
          text: "Курс создан. Приёмов добавлено в задачи: " + res.created,
          duration: 5000
        });
        break;

      case "save-vaccine":
        if (!S.addVaccination(val("vType"), val("vDate"), val("vProduct"), val("vClinic"), val("vNext"))) {
          toast({ icon: "ti-alert-circle", text: "Укажите тип вакцины" });
          break;
        }
        closeSheet();
        toast({ icon: "ti-vaccine", text: "Вакцинация записана" });
        break;

      case "save-weight":
        if (!S.addWeight(val("wKg"))) {
          toast({ icon: "ti-alert-circle", text: "Вес должен быть числом больше нуля" });
          break;
        }
        closeSheet();
        toast({ icon: "ti-scale", text: "Вес записан" });
        break;

      case "save-event":
        var kind = document.getElementById("evKinds").dataset.picked;
        if (!S.addEvent(kind, val("evTitle"), val("evText"))) {
          toast({ icon: "ti-alert-circle", text: "Опишите, что наблюдаете" });
          break;
        }
        closeSheet();
        toast({ icon: "ti-notes", text: kind === "symptom" ? "Симптом записан" : "Событие записано" });
        break;

      case "save-pet":
        S.updatePet(val("pName"), val("pBreed"), val("pChip"), val("pAllergies"));
        closeSheet();
        toast({ icon: "ti-check", text: "Профиль обновлён" });
        break;

      case "delete-task":
        S.deleteTask(id);
        closeSheet();
        toast({ icon: "ti-trash", text: "Задача удалена" });
        break;

      case "sim-partner":
        closeSheet();
        var t = S.simulatePartner();
        if (t) {
          toast({ icon: "ti-user-check", text: "Дима · отметка: " + t.title + ". Напоминание снято у всех", duration: 5000 });
        } else {
          toast({ icon: "ti-check", text: "Невыполненных задач не осталось" });
        }
        break;

      case "sim-conflict":
        closeSheet();
        var c = S.simulateConflict();
        if (!c) {
          toast({ icon: "ti-check", text: "Невыполненных задач не осталось" });
          break;
        }
        toast({
          icon: "ti-git-merge",
          text: "Вы отметили «" + c.task.title + "», но отметка уже была — " + c.by.name + ", " +
            S.hhmm(c.hisAt) + ", на 4 минуты раньше. Записан один приём.",
          duration: 7000
        });
        break;

      case "sim-offline":
        closeSheet();
        var goingOffline = S.state.settings.online;
        var synced = S.setOnline(!goingOffline);
        if (goingOffline) {
          toast({ icon: "ti-wifi-off", text: "Офлайн. Задачи, курсы и карточка остаются доступны", duration: 5000 });
        } else {
          toast({
            icon: "ti-cloud-check",
            text: synced ? "Связь есть. Отправлено изменений: " + synced : "Связь есть. Всё синхронизировано",
            duration: 4000
          });
        }
        break;

      case "reset":
        closeSheet();
        S.reset();
        currentTab = "today";
        toast({ icon: "ti-refresh", text: "Данные прототипа сброшены" });
        break;

      default:
        break;
    }
  }

  /* --- запуск ------------------------------------------- */

  function init() {
    appbarEl = document.getElementById("appbar");
    screenEl = document.getElementById("screen");
    tabbarEl = document.getElementById("tabbar");
    sheetEl = document.getElementById("sheet");
    toastEl = document.getElementById("toast");

    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-act]");
      if (el) {
        e.preventDefault();
        handle(el.getAttribute("data-act"), el);
        return;
      }
      if (e.target === sheetEl) closeSheet();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSheet();
    });

    S.subscribe(render);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
