import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';
import { createDemoShell, escape } from './demos/shell.js';
import { createFrameDemo } from './demos/frameDemo.js';
import { createBeautyBookDemo } from './demos/beautyBookDemo.js';
import { createLibraryDemo } from './demos/libraryDemo.js';
import { createSiteFrameDemo } from './demos/siteFrameDemo.js';
import { createSiteDemo } from './demos/siteDemos.js';

(() => {
  'use strict';
  const { language, internal, root, icons } = RQKE;
  const data = RQKE_DATA;
  const main = document.getElementById('main');
  const slug = document.body.dataset.project;
  if (!main || !slug) return;
  const lang = language();
  const index = data.projects.findIndex(project => project.slug === slug);
  if (index < 0) { main.innerHTML = '<section class="static-notice"><h1>Project not found</h1></section>'; return; }
  const project = data.localizeProject(data.projects[index], lang);
  const previous = data.localizeProject(data.projects[(index - 1 + data.projects.length) % data.projects.length], lang);
  const next = data.localizeProject(data.projects[(index + 1) % data.projects.length], lang);
  const asset = src => root(src.replace(/^\/images\//, 'assets/images/'));
  const demoFactories = { 'beauty-booking': createBeautyBookDemo, 'library-system': createLibraryDemo };
  const demo = demoFactories[slug]?.({ lang, root }) ?? createSiteDemo(slug, { lang, root });
  const text = {
    ru: { all: 'Все проекты', work: 'Работа', inside: 'Что внутри', tryDemo: 'Попробовать демо', live: 'Открыть рабочую версию', demoKicker: 'Интерактивная демо-версия', demoTitle: ['Пролистайте сервис ', 'сами'], demoLead: 'Кликайте по разделам, фильтрам и кнопкам — всё работает как в настоящем сервисе. Данные демонстрационные, ничего никуда не отправляется.', role: 'Режим', device: 'Экран', desktop: 'Компьютер', mobile: 'Телефон', backNav: 'Назад', forwardNav: 'Вперёд', restart: 'Начать заново', openTab: 'Открыть в новой вкладке', featuresKicker: 'Возможности', featuresTitle: 'Что умеет сервис', show: 'Показать в демо', screensKicker: 'Реальные экраны', screensTitle: 'Как это выглядит в работе', enlarge: 'Увеличить изображение', projectNav: 'Навигация между проектами', previous: '← Предыдущий проект', next: 'Следующий проект →', question: 'Нужен похожий сервис?', finalTitle: 'Расскажите, как должен работать ваш процесс — обсудим, что войдёт в первую версию.', cta: 'Обсудить задачу', viewer: 'Просмотр изображения', close: 'Закрыть', prevImage: 'Предыдущее изображение', nextImage: 'Следующее изображение' },
    en: { all: 'All projects', work: 'Work', inside: 'Inside', tryDemo: 'Try the demo', live: 'Open the live version', demoKicker: 'Interactive demo', demoTitle: ['Explore the service ', 'yourself'], demoLead: 'Click through sections, filters and buttons — everything works like the real service. Demo data only; nothing is sent anywhere.', role: 'Mode', device: 'Screen', desktop: 'Desktop', mobile: 'Phone', backNav: 'Back', forwardNav: 'Forward', restart: 'Start over', openTab: 'Open in a new tab', featuresKicker: 'Capabilities', featuresTitle: 'What the service does', show: 'Show in demo', screensKicker: 'Real screens', screensTitle: 'How it looks in use', enlarge: 'Enlarge image', projectNav: 'Project navigation', previous: '← Previous project', next: 'Next project →', question: 'Need a similar service?', finalTitle: 'Tell me how your process should work — we’ll decide what goes into the first version.', cta: 'Discuss your needs', viewer: 'Image viewer', close: 'Close', prevImage: 'Previous image', nextImage: 'Next image' }
  }[lang];
  const number = String(index + 1).padStart(2, '0');
  const browserBar = '<span class="pj-dots" aria-hidden="true"><i></i><i></i><i></i></span>';

  document.title = `${project.title} — rqke / SYSTEMS`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', project.shortDescription);

  main.className = 'pj-page';
  main.innerHTML = `
    <section class="pj-hero">
      <a href="${internal('projects/', lang)}" class="pj-back">${icons.arrowLeft} ${text.all}</a>
      <div class="pj-hero-grid">
        <div class="pj-hero-copy">
          <p class="pj-eyebrow">${text.work} ${number} · ${escape(project.kind)}</p>
          <h1>${escape(project.title)}</h1>
          <p class="pj-subtitle">${escape(project.subtitle)}</p>
          <p class="pj-pitch">${escape(project.pitch)}</p>
          <div class="pj-actions">
            ${demo ? `<a class="pj-btn pj-btn-dark" href="#demo">${text.tryDemo} ${icons.arrowDown}</a>` : ''}
            ${project.liveUrl ? `<a class="pj-btn pj-btn-line" href="${project.liveUrl}" target="_blank" rel="noreferrer">${text.live} ${icons.arrowUpRight}</a>` : ''}
          </div>
        </div>
        <aside class="pj-hero-card">
          <p class="pj-eyebrow">${text.inside}</p>
          <ul>${project.highlights.map(item => `<li>${icons.check}<span>${escape(item)}</span></li>`).join('')}</ul>
          <img src="${asset(project.coverImage.src)}" alt="${escape(project.coverImage.alt)}" width="${project.coverImage.width}" height="${project.coverImage.height}">
        </aside>
      </div>
    </section>
    ${demo ? `<section class="pj-demo" id="demo">
      <div class="pj-demo-head">
        <div><p class="pj-eyebrow">${text.demoKicker}</p><h2>${text.demoTitle[0]}<em>${text.demoTitle[1]}</em></h2></div>
        <p>${text.demoLead}</p>
      </div>
      <div class="pj-demo-controls">
        ${demo.roles.length ? `<div class="pj-seg" role="group" aria-label="${text.role}">${demo.roles.map(role => `<button type="button" data-role="${role.id}" aria-pressed="false">${escape(role.label)}</button>`).join('')}</div>` : ''}
        <div class="pj-seg" role="group" aria-label="${text.device}"><button type="button" data-device="desktop" aria-pressed="true">${text.desktop}</button><button type="button" data-device="mobile" aria-pressed="false">${text.mobile}</button></div>
      </div>
      <div class="pj-browser" data-device="desktop">
        <div class="pj-browser-bar">
          ${browserBar}
          <button type="button" data-demo-back aria-label="${text.backNav}">${icons.arrowLeft}</button>
          <button type="button" data-demo-forward aria-label="${text.forwardNav}">${icons.arrowRight}</button>
          <div class="pj-url"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span data-demo-url></span></div>
          ${demo.type === 'frame' || demo.type === 'site' ? `<a data-demo-open target="_blank" rel="noopener" aria-label="${text.openTab}" title="${text.openTab}">${icons.arrowUpRight}</a>` : ''}
          <button type="button" data-demo-reset aria-label="${text.restart}" title="${text.restart}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="pj-browser-view" data-demo-view tabindex="0"></div>
      </div>
    </section>` : ''}
    <section class="pj-features">
      <div class="pj-section-head"><p class="pj-eyebrow">${text.featuresKicker}</p><h2>${text.featuresTitle}</h2></div>
      <ol>${project.features.map((feature, i) => `<li>
        <span class="pj-num">0${i + 1}</span>
        <div><h3>${escape(feature.title)}</h3><p>${escape(feature.description)}</p></div>
        ${demo && feature.screen ? `<button type="button" class="pj-show" data-screen="${feature.screen}">${text.show} ${icons.arrowRight}</button>` : ''}
      </li>`).join('')}</ol>
    </section>
    <section class="pj-screens">
      <div class="pj-section-head"><p class="pj-eyebrow">${text.screensKicker}</p><h2>${text.screensTitle}</h2></div>
      <div class="pj-shots">${project.gallery.map((image, i) => `<figure>
        <button type="button" class="pj-shot" data-gallery-index="${i}" aria-label="${text.enlarge}: ${escape(image.alt)}">
          <span class="pj-shot-bar">${browserBar}</span>
          <img src="${asset(image.src)}" alt="${escape(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy">
        </button>
        ${image.caption ? `<figcaption><span>${String(i + 1).padStart(2, '0')}</span>${escape(image.caption)}</figcaption>` : ''}
      </figure>`).join('')}</div>
    </section>
    <nav class="pj-nav" aria-label="${text.projectNav}"><a href="${internal(`projects/${previous.slug}/`, lang)}"><span>${text.previous}</span><strong>${escape(previous.title)}</strong></a><a href="${internal(`projects/${next.slug}/`, lang)}"><span>${text.next}</span><strong>${escape(next.title)}</strong></a></nav>
    <section class="pj-cta"><p class="pj-eyebrow">${text.question}</p><h2>${text.finalTitle}</h2><a class="pj-btn pj-btn-light" href="${internal('index.html#contact', lang)}">${text.cta} ${icons.arrowUpRight}</a></section>`;

  if (demo) {
    const section = main.querySelector('.pj-demo');
    const browser = section.querySelector('.pj-browser');
    const shell = demo.type === 'frame' ? createFrameDemo(browser, demo) : demo.type === 'site' ? createSiteFrameDemo(browser, demo) : createDemoShell(browser, demo);
    const roleButtons = section.querySelectorAll('[data-role]');
    shell.onRoute(route => {
      const role = demo.roleOf(route);
      roleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
    });
    roleButtons.forEach(button => button.addEventListener('click', () => {
      const role = demo.roles.find(item => item.id === button.dataset.role);
      if (role && demo.roleOf(shell.route()) !== role.id) shell.go(...role.route);
    }));
    section.querySelectorAll('.pj-seg [data-device]').forEach(button => button.addEventListener('click', () => {
      browser.dataset.device = button.dataset.device;
      section.querySelectorAll('.pj-seg [data-device]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }));
    browser.querySelector('[data-demo-reset]').addEventListener('click', () => shell.reset());
    main.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => {
      const target = demo.screens[button.dataset.screen];
      if (target) shell.go(...target);
      section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }));
  }

  let active = 0;
  let trigger = null;
  let lightbox = null;
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove(); lightbox = null; document.body.style.overflow = ''; trigger?.focus();
  }
  function step(delta) { active = (active + delta + project.gallery.length) % project.gallery.length; renderLightbox(); }
  function openLightbox(indexValue, sourceButton) {
    active = indexValue; trigger = sourceButton;
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox'; lightbox.setAttribute('role', 'dialog'); lightbox.setAttribute('aria-modal', 'true'); lightbox.setAttribute('aria-label', text.viewer);
    document.body.style.overflow = 'hidden';
    renderLightbox();
    document.body.append(lightbox);
    lightbox.querySelector('.lightbox-close')?.focus();
  }
  function renderLightbox() {
    const image = project.gallery[active];
    lightbox.innerHTML = `<button class="lightbox-close" type="button" aria-label="${text.close}">${icons.close}</button><button class="lightbox-prev" type="button" aria-label="${text.prevImage}">${icons.arrowLeft}</button><figure><img src="${asset(image.src)}" alt="${escape(image.alt)}" width="${image.width}" height="${image.height}"><figcaption>${active + 1} / ${project.gallery.length} — ${escape(image.caption || image.alt)}</figcaption></figure><button class="lightbox-next" type="button" aria-label="${text.nextImage}">${icons.arrowRight}</button>`;
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => step(-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => step(1));
  }
  main.querySelectorAll('[data-gallery-index]').forEach(button => button.addEventListener('click', () => openLightbox(Number(button.dataset.galleryIndex), button)));
  addEventListener('keydown', event => {
    if (!lightbox) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  });
})();
