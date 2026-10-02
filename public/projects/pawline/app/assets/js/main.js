/* ============================================================
   PAWLINE — landing behaviour
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- analytics ---------------------------------------- */
  function track(event, params) {
    var payload = params || {};
    if (typeof window.gtag === "function") {
      window.gtag("event", event, payload);
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: event }, payload));
    }
  }

  /* --- scroll depth ------------------------------------- */
  var depthMarks = [25, 50, 75, 100];
  var depthSent = {};

  function reportDepth() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    depthMarks.forEach(function (mark) {
      if (pct >= mark && !depthSent[mark]) {
        depthSent[mark] = true;
        track("scroll_depth", { percent: mark });
      }
    });
  }

  /* --- sticky nav --------------------------------------- */
  var nav = document.getElementById("nav");
  var mobileCta = document.getElementById("mobileCta");

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("is-stuck", y > 20);
    if (mobileCta) mobileCta.classList.toggle("is-visible", y > 600);
    reportDepth();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- mobile menu -------------------------------------- */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = '<i class="ti ti-menu-2" aria-hidden="true"></i>';
  }

  burger.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.innerHTML = open
      ? '<i class="ti ti-x" aria-hidden="true"></i>'
      : '<i class="ti ti-menu-2" aria-hidden="true"></i>';
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  /* --- reveal on scroll --------------------------------- */
  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.08 }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* --- hero live mockup --------------------------------- */
  var heroPhone = document.getElementById("heroPhone");
  var toast = document.getElementById("heroToast");
  var toastText = document.getElementById("heroToastText");
  var heroTasks = heroPhone ? Array.prototype.slice.call(heroPhone.querySelectorAll("[data-task]")) : [];
  var names = { М: "Маша", Д: "Дима", К: "Костя" };
  var heroTimers = [];
  var heroStarted = false;

  function clearHeroTimers() {
    heroTimers.forEach(clearTimeout);
    heroTimers = [];
  }

  function later(fn, ms) {
    heroTimers.push(setTimeout(fn, ms));
  }

  function showToast(task) {
    var who = names[task.dataset.who] || task.dataset.who;
    var name = task.querySelector(".task-name").textContent;
    toastText.textContent = who + " отметил: " + name;
    toast.classList.add("is-visible");
    later(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function runHeroCycle() {
    clearHeroTimers();
    heroTasks.forEach(function (task) {
      task.classList.remove("is-done");
    });

    heroTasks.forEach(function (task, i) {
      later(function () {
        task.classList.add("is-done");
        showToast(task);
      }, 1200 + i * 2100);
    });

    later(runHeroCycle, 1200 + heroTasks.length * 2100 + 3600);
  }

  if (heroTasks.length) {
    if (reduceMotion) {
      heroTasks.slice(0, 3).forEach(function (task) {
        task.classList.add("is-done");
      });
    } else if ("IntersectionObserver" in window) {
      var heroObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !heroStarted) {
              heroStarted = true;
              runHeroCycle();
            } else if (!entry.isIntersecting && heroStarted) {
              heroStarted = false;
              clearHeroTimers();
              toast.classList.remove("is-visible");
            }
          });
        },
        { threshold: 0.25 }
      );
      heroObserver.observe(heroPhone);
    } else {
      runHeroCycle();
    }

    heroPhone.addEventListener(
      "click",
      function () {
        track("demo_interact", { location: "hero" });
      },
      { once: true }
    );
  }

  /* --- scenario tabs ------------------------------------ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".tab-panel"));

  function selectTab(index) {
    tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      panels[i].classList.toggle("is-active", active);
      panels[i].hidden = !active;
    });
    track("scenario_tab", { tab: tabs[index].textContent.trim() });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      selectTab(i);
    });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (next === null) return;
      e.preventDefault();
      selectTab(next);
      tabs[next].focus();
    });
  });

  /* --- faq accordion ------------------------------------ */
  document.querySelectorAll(".faq-q").forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      if (open) track("faq_open", { index: i + 1, question: btn.textContent.trim() });
    });
  });

  /* --- qr modal (desktop store clicks) ------------------ */
  var modal = document.getElementById("qrModal");
  var modalClose = document.getElementById("qrClose");
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modalClose.focus();
    track("qr_modal_open");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    if (lastFocused) lastFocused.focus();
  }

  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.classList.contains("is-open")) closeModal();
      if (mobileMenu.classList.contains("is-open")) closeMenu();
    }
  });

  /* --- store links -------------------------------------- */
  var STORE_URLS = {
    ios: "app/",
    android: "android/dist/pawline-debug.apk"
  };

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isMobile = isIOS || isAndroid;

  document.querySelectorAll("[data-store]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var store = link.dataset.store;
      track("store_click", { store: store, cta: link.dataset.cta || "unknown" });

      e.preventDefault();
      window.open(STORE_URLS[store], "_blank", "noopener");
    });
  });

  /* --- generic cta tracking ----------------------------- */
  document.querySelectorAll("[data-cta]:not([data-store])").forEach(function (el) {
    el.addEventListener("click", function () {
      track("cta_click", { cta: el.dataset.cta });
    });
  });

  /* --- smart download target on mobile ------------------ */
  if (isMobile) {
    document.querySelectorAll('a[href="#download"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        track("cta_click", { cta: link.dataset.cta || "download", resolved: isIOS ? "ios" : "android" });
        window.open(isIOS ? STORE_URLS.ios : STORE_URLS.android, "_blank", "noopener");
      });
    });
  }
})();
