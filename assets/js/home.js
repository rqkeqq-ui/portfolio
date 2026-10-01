import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';
import { dictionary, projectCopy, contactCopy } from './home-copy.js';
import { mountCalBooking } from './booking.js';
import heroImageUrl from '../images/statues/rqke-hero-cutout.png';

(() => {
  'use strict';

  // Keep the mobile layout tied to the *visual* viewport as well as CSS media
  // queries. Chrome device emulation and some mobile browsers can expose a
  // wider layout viewport while the visible viewport is phone-sized.
  const syncForcedMobileLayout = () => {
    const widths = [
      window.innerWidth,
      document.documentElement.clientWidth,
      window.visualViewport?.width,
      window.screen?.width,
    ].filter(value => Number.isFinite(value) && value > 0);
    const visualWidth = Math.min(...widths);
    const mobile = visualWidth <= 1100;
    document.documentElement.classList.toggle('rqke-force-mobile', mobile);
    const hero = document.querySelector('.rk-hero-shell');
    const traits = document.querySelector('.rk-hero-traits');
    const heroCopy = hero?.querySelector('.rk-hero-copy');
    if (!heroCopy || !traits) return;
    if (mobile) hero.after(traits);
    else heroCopy.after(traits);
    const stage = hero.querySelector('.rk-hero-stage');
    if (mobile && visualWidth <= 767 && innerHeight > visualWidth) {
      const height = Math.min(innerHeight, document.documentElement.clientHeight, window.visualViewport?.height || innerHeight);
      stage.style.setProperty('--hero-art-space', `${Math.max(148, Math.min(420, height - heroCopy.offsetHeight - 16))}px`);
    } else stage.style.removeProperty('--hero-art-space');
  };
  syncForcedMobileLayout();
  window.visualViewport?.addEventListener('resize', syncForcedMobileLayout, { passive: true });
  window.addEventListener('resize', syncForcedMobileLayout, { passive: true });
  const { icons, root, language: getLanguage, switchLanguage, rolling, internal, fixRuTypography } = RQKE;
  const data = RQKE_DATA;
  const main = document.getElementById('main');
  if (!main) return;

  let language = getLanguage();
  let copy = dictionary[language];
  let projectText = projectCopy[language];
  let contactText = { ...contactCopy[language] };
  const projects = data.projects.filter(project => project.featured).map(project => data.localizeProject(project, language));
  const github = data.links.find(link => link.id === 'github')?.url || 'https://github.com/rqkeqq-ui';
  const telegram = data.links.find(link => link.id === 'telegram')?.url || 'https://t.me/lqkeee';
  const navigation = copy.navigation.map(([id, label]) => ({ id, label }));
  const serviceIcons = ['globe', 'app', 'database', 'workflow', 'app', 'workflow'];
  const sectionIds = ['home', 'services', 'projects', 'overview', 'about', 'collaboration', 'faq', 'contact'];
  const asset = src => root(src.replace(/^\/images\//, 'assets/images/'));
  const escape = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function projectHref(slug) { return internal(`projects/${slug}/`, language); }

  function renderProjectRail() {
    return `
      <section id="projects" class="projects-rail-section" style="height:${Math.max(210, 120 + projects.length * 48)}svh" aria-labelledby="projects-title">
        <div class="projects-rail-sticky">
          <div class="projects-rail-heading">
            <p class="eyebrow">${projectText.eyebrow}</p>
            <h2 id="projects-title">${projectText.title}</h2>
            <p>${projectText.lead}</p>
          </div>
          <div class="project-rail-viewport">
            <div class="project-rail-track" data-has-focus="false" data-video-ready="true">
              ${projects.map((project, index) => {
                const signals = project.tags || [data.formatCategory(project.category, language)];
                const description = project.shortDescription || project.shortDescription;
                return `<a href="${projectHref(project.slug)}" class="project-rail-card" data-index="${index}" data-active="${index === 0}" aria-label="${escape(projectText.open)}: ${escape(project.title)}" data-device="none" style="--project-fit:cover">
                  <span class="project-rail-media"><img src="${asset(project.coverImage.src)}" alt="" loading="lazy"></span>
                  <span class="project-rail-motion" aria-hidden="true"></span><span class="project-rail-shade" aria-hidden="true"></span>
                  <span class="project-rail-topline"><span class="project-rail-number">${String(index + 1).padStart(2, '0')}</span><span class="project-rail-tags">${signals.map(item => `<span>${escape(item)}</span>`).join('')}</span></span>
                  <span class="project-rail-copy"><span class="project-rail-type">${escape(data.formatStatus(project.status, language))}</span><strong>${escape(project.title)}</strong><span class="project-rail-subtitle">${escape(project.subtitle)}</span><span class="project-rail-description">${escape(description)}</span></span>
                  <span class="project-rail-arrow" aria-hidden="true">${icons.arrowUpRight}</span>
                </a>`;
              }).join('')}
              <div class="project-rail-end" aria-label="${escape(projectText.endTitle)}"><span>rqke / NEXT</span><strong>${projectText.endTitle}</strong><span>${projectText.endText}</span><a href="#contact">${projectText.endCta} ${icons.arrowUpRight}</a></div>
            </div>
          </div>
          <div class="projects-rail-footer"><span class="projects-rail-counter">01 / ${String(projects.length).padStart(2, '0')}</span><div class="project-rail-progress" aria-hidden="true"><span></span></div><a href="${internal('projects/', language)}">${projectText.all}${icons.arrowUpRight}</a></div>
        </div>
      </section>`;
  }

  const booking = data.booking;
  const bookingEnabled = Boolean(booking.bookingUrl && booking.calLink);
  let bookingOpen = false;
  const track = name => document.dispatchEvent(new CustomEvent('rqke:analytics', { detail: { name } }));
  function renderContact() {
    return `<section id="contact" class="contact-section" aria-labelledby="contact-title">
      <div class="contact-copy"><p class="eyebrow">${contactText.eyebrow}</p><h2 id="contact-title">${contactText.title}</h2><p>${bookingEnabled ? (language === 'ru' ? 'Расскажите, что хотите запустить или изменить. Можно выбрать время разговора или начать с сообщения.' : 'Tell me what you want to launch or change. Choose a time for a call or start with a message.') : contactText.lead}</p></div>
      <div class="contact-options"><article><h3>${contactText.callTitle}</h3><p>${contactText.callText}</p>${bookingEnabled ? `<button id="booking-toggle" class="button button-dark" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="booking-panel">${contactText.choose}${icons.arrowUpRight}</button>` : `<p class="booking-pending">${contactText.callPending}</p><a class="button button-dark" href="${telegram}" target="_blank" rel="noopener noreferrer">${contactText.telegram}${icons.telegram}</a>`}</article>
      <article><h3>${contactText.messageTitle}</h3><p>${contactText.messageText}</p><a class="button contact-message" href="${telegram}" target="_blank" rel="noopener noreferrer">${contactText.telegram}${icons.telegram}</a></article></div>
      ${bookingEnabled ? `<dialog id="booking-panel" class="booking-modal" aria-labelledby="booking-heading"><div class="booking-modal-header"><h3 id="booking-heading" tabindex="-1">${contactText.bookingTitle}</h3><button type="button" class="booking-close" aria-label="${contactText.bookingClose}">${icons.close}</button></div><div class="booking-modal-body"><p class="booking-timezone">${contactText.bookingTimezone}</p><p class="booking-loading" role="status">${contactText.bookingOpening}</p><div class="booking-frame"></div><div class="booking-modal-fallback"><p>${contactText.bookingFallback}</p><a class="booking-external" href="${escape(booking.bookingUrl)}" target="_blank" rel="noopener noreferrer">${contactText.bookingExternal} ↗</a><p>${contactText.bookingAlternative} <a href="${telegram}" target="_blank" rel="noopener noreferrer">Telegram ↗</a></p></div></div></dialog>` : ''}
      <details class="brief-details"><summary>${contactText.help}${icons.arrowDown}</summary><form class="contact-form" novalidate>
      <div class="contact-form-heading"><h3>${contactText.formTitle}</h3><p>${contactText.formLead}</p></div>
      <label>${contactText.description} *<small id="description-hint">${contactText.descriptionHint}</small><textarea name="description" rows="5" required aria-describedby="description-hint description-error"></textarea><small id="description-error" class="field-error" hidden></small></label>
      <div class="field-row"><label>${contactText.contact} *<input name="contact" required aria-describedby="contact-hint contact-error"><small id="contact-hint">${contactText.contactHint}</small><small id="contact-error" class="field-error" hidden></small></label><label>${contactText.name}<input name="name" autocomplete="name"></label></div>
      <details class="brief-extra"><summary>${contactText.additional}</summary><label>${contactText.company}<input name="company" autocomplete="organization"></label><div class="field-row"><label>${contactText.budget}<input name="budget"></label><label>${contactText.deadline}<input name="deadline"></label></div></details>
      <p class="form-error" role="alert" hidden></p><button class="button button-dark" type="submit">${contactText.submit}${icons.arrowUpRight}</button></form></details>
    </section>`;
  }

  function renderFaq() {
    const splitAt = Math.ceil(copy.faq.length / 2);
    const columns = [copy.faq.slice(0, splitAt), copy.faq.slice(splitAt)];
    return `<div class="rk-faq-grid">${columns.map(column => `<div class="rk-faq-column">${column.map(([question, answer]) => `<details data-reveal><summary><span>${question}</span><i aria-hidden="true"></i></summary><div class="rk-faq-answer"><p>${answer}</p></div></details>`).join('')}</div>`).join('')}</div>`;
  }

  function render() {
    document.title = language === 'ru' ? 'rqke / SYSTEMS — разработка сайтов, сервисов и автоматизации' : 'rqke / SYSTEMS — Websites, Software & Automation';
    const description = language === 'ru' ? 'Независимая разработка для бизнеса: сайты, приложения, клиентские сервисы, внутренние системы и автоматизация. Обсудите задачу или запишитесь на созвон.' : 'Independent development for businesses: websites, applications, customer services, internal tools and automation. Discuss your needs or book a call.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);

    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    main.className = 'rqke-experience';
    main.dataset.language = language;
    main.innerHTML = `
      <div class="rk-intro" data-state="visible" aria-hidden="true"><span>rqke</span><i></i><small>${copy.intro}</small></div>
      <header class="rk-mobile-header"><a class="rk-mobile-brand" href="#home" aria-label="${copy.homeLabel}">rqke <i>/</i> <span>SYSTEMS</span></a><div class="rk-mobile-tools"><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a><button class="rk-mobile-menu-button" type="button" aria-label="${copy.openMenu}" aria-controls="rk-mobile-menu" aria-expanded="false">${icons.menu}</button></div></header>
      <div id="rk-mobile-menu" class="rk-mobile-menu" data-open="false" aria-hidden="true"><p>rqke / NAVIGATION / 2026</p><nav aria-label="${copy.navLabel}">${navigation.map((item, index) => `<a href="#${item.id}" tabindex="-1"><small>${String(index).padStart(2, '0')}</small><span>${item.label}</span>${icons.arrowUpRight}</a>`).join('')}</nav></div>
      <aside class="rk-rail" data-visible="false" data-theme="light" aria-label="${copy.railLabel}" aria-hidden="true" inert>
        <div class="rk-rail-brand"><div><a href="#home">rqke <i>/</i></a><span>SYSTEMS</span></div><div class="rk-rail-socials"><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button></div><p>${copy.railText}</p></div>
        <nav class="rk-rail-nav" aria-label="${copy.navLabel}">${navigation.map((item, index) => `<a href="#${item.id}"${index === 0 ? ' aria-current="location"' : ''}><span>${String(index).padStart(2, '0')}</span><span>${item.label}</span></a>`).join('')}</nav>
        <div class="rk-rail-marquee" aria-label="rqke systems"><div>${['CONTEXT','ARCHITECTURE','DEVELOPMENT','RESULT','CONTEXT','ARCHITECTURE','DEVELOPMENT','RESULT'].map(item => `<span>${item}</span>`).join('')}</div></div>
        <a class="rk-rail-cta" href="#contact">${rolling(copy.railCta)}${icons.arrowUpRight}</a>
      </aside>
      <section id="home" class="rk-hero-shell" aria-labelledby="hero-title"><div class="rk-hero-stage"><div class="rk-hero-grid" aria-hidden="true"></div><p class="rk-hero-wordmark" aria-hidden="true">rqke <span>/ SYSTEMS</span></p>
        <nav class="rk-hero-nav rk-hero-nav-left" aria-label="${copy.navLabel}">${navigation.slice(0,3).map(item => `<a href="#${item.id}">${rolling(item.label)}</a>`).join('')}</nav><nav class="rk-hero-nav rk-hero-nav-right" aria-label="${copy.navLabel}">${navigation.slice(3).map(item => `<a href="#${item.id}">${rolling(item.label)}</a>`).join('')}</nav>
        <div class="rk-hero-tools"><button class="rk-language js-language" type="button" aria-label="${copy.language}">${language === 'ru' ? 'EN' : 'RU'}</button><a href="${github}" target="_blank" rel="noreferrer" aria-label="GitHub rqke" title="GitHub">${icons.github}</a><a href="${telegram}" target="_blank" rel="noreferrer" aria-label="Telegram rqke" title="Telegram">${icons.telegram}</a></div>
        <div class="rk-hero-sculpture" aria-hidden="true"><div class="rk-hero-orbit"></div><img src="${heroImageUrl}" alt="" width="1122" height="1402"></div>
        <div class="rk-hero-traits">${copy.traits.map(item => `<p>${icons.check}${item}</p>`).join('')}</div>
        <div class="rk-hero-copy"><p class="rk-hero-kicker">${copy.heroKicker}</p><h1 id="hero-title">${copy.heroTitle} <em>${copy.heroAccent}</em></h1><p class="rk-hero-lead">${copy.heroText}</p><p class="rk-hero-hint">${copy.heroHint}</p><div class="rk-hero-actions"><a class="rk-hero-primary" href="#contact">${rolling(copy.discussProject)}${icons.arrowUpRight}</a><a class="rk-hero-secondary" href="#projects">${rolling(copy.viewProjects)}${icons.arrowDown}</a></div></div>
      </div></section>
      <section id="services" class="rk-section rk-services" aria-labelledby="services-title"><div class="rk-services-intro" data-reveal><p class="rk-eyebrow">${copy.servicesEyebrow}</p><h2 id="services-title">${copy.servicesTitle}</h2><p>${copy.servicesLead}</p></div><div class="rk-service-grid">${copy.services.map((service,index) => `<article data-reveal style="--reveal-delay:${index*45}ms"><div><span>${service.number}</span><small>${service.label}</small>${icons[serviceIcons[index]]}</div><h3>${service.title}</h3><p>${service.description}</p><ul>${service.items.map(item => `<li>${icons.check}${item}</li>`).join('')}</ul><a href="#contact">${rolling(copy.discussDirection)}${icons.arrowUpRight}</a></article>`).join('')}</div><p class="rk-services-note">${copy.servicesNote}</p></section>
      ${renderProjectRail()}
      <section id="overview" class="rk-section rk-overview" aria-labelledby="overview-title"><div class="rk-overview-heading" data-reveal><p class="rk-eyebrow">${copy.overviewEyebrow}</p><h2 id="overview-title">${copy.overviewTitle}</h2><p>${copy.overviewLead}</p></div><div class="rk-capability-list">${copy.capabilities.map(([number,title,description]) => `<article data-reveal><span>${number}</span><h3>${title}</h3><p>${description}</p>${icons.arrowUpRight}</article>`).join('')}</div></section>
      <section id="about" class="rk-section rk-about" aria-labelledby="about-title"><div class="rk-section-intro" data-reveal><p class="rk-eyebrow">${copy.approachEyebrow}</p><h2 id="about-title">${copy.approachTitle}</h2><p>${copy.approachLead}</p></div><div class="rk-journey" aria-label="${copy.journeyLabel}"><p class="rk-journey-label">${copy.journeyLabel}</p><svg class="rk-journey-path" aria-hidden="true" focusable="false"><path></path></svg><div class="rk-journey-list">${copy.journey.map((item,index) => `<article class="rk-journey-card" data-reveal data-journey-index="${index}" style="--reveal-delay:${index*35}ms"><span class="rk-journey-anchor" aria-hidden="true"></span><div><span>${item.marker}</span><small><b aria-hidden="true">/</b>${item.label}</small></div><h3>${item.title}</h3><p>${item.summary}</p><div><small class="rk-stage-signature">rqke / SYSTEMS · ${String(index+1).padStart(2,'0')} ${copy.stage}</small><button type="button" aria-label="${copy.details}: ${escape(item.title)}">${rolling(copy.details)}${icons.arrowUpRight}</button></div></article>`).join('')}</div></div></section>
      <dialog class="rk-journey-dialog" aria-labelledby="rk-dialog-title"></dialog>
      <section id="collaboration" class="rk-section rk-collaboration" aria-labelledby="collaboration-title"><span id="testimonial" aria-hidden="true"></span><div class="rk-section-intro" data-reveal><p class="rk-eyebrow">${copy.collaborationEyebrow}</p><h2 id="collaboration-title">${copy.collaborationTitle}</h2><p>${copy.collaborationLead}</p></div><div class="rk-cost" data-reveal><h3>${copy.costTitle}</h3><p>${copy.costText}</p><p>${copy.changeText}</p><a class="button button-dark" href="#contact">${copy.firstPhase}${icons.arrowUpRight}</a></div></section>
      <section id="faq" class="rk-section rk-faq" aria-labelledby="faq-title"><div class="rk-faq-heading" data-reveal><p class="rk-eyebrow">${copy.faqEyebrow}</p><h2 id="faq-title">${copy.faqTitle}</h2></div>${renderFaq()}</section>
      ${renderContact()}
      <a class="rk-floating-mark" href="#home" data-scene="home" aria-label="${copy.backToTop}">rqke</a>`;
  }

  render();
  syncForcedMobileLayout();
  document.fonts?.ready.then(syncForcedMobileLayout);

  const intro = main.querySelector('.rk-intro');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipIntro = reducedMotion || Boolean(location.hash) || sessionStorage.getItem('rqke-intro-seen') === 'true';
  if (skipIntro) intro?.remove();
  else {
    sessionStorage.setItem('rqke-intro-seen', 'true');
    setTimeout(() => intro?.setAttribute('data-state', 'leaving'), 1250);
    setTimeout(() => intro?.remove(), 1900);
  }

  main.querySelectorAll('.js-language').forEach(button => button.addEventListener('click', switchLanguage));

  const mobileToggle = main.querySelector('.rk-mobile-menu-button');
  const mobileMenu = main.querySelector('.rk-mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a') || [];
  function setMobileMenu(open) {
    mobileMenu?.setAttribute('data-open', String(open));
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    mobileToggle?.setAttribute('aria-expanded', String(open));
    mobileToggle?.setAttribute('aria-label', open ? copy.closeMenu : copy.openMenu);
    if (mobileToggle) mobileToggle.innerHTML = open ? icons.close : icons.menu;
    mobileLinks.forEach(link => link.tabIndex = open ? 0 : -1);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  mobileToggle?.addEventListener('click', () => setMobileMenu(mobileToggle.getAttribute('aria-expanded') !== 'true'));
  mobileLinks.forEach(link => link.addEventListener('click', () => setMobileMenu(false)));
  addEventListener('keydown', event => { if (event.key === 'Escape') setMobileMenu(false); });

  const rail = main.querySelector('.rk-rail');
  const hero = main.querySelector('.rk-hero-shell');
  const journeySection = main.querySelector('.rk-journey');
  const journeyPath = main.querySelector('.rk-journey-path');
  const journeyPathLine = journeyPath?.querySelector('path');
  const journeyAnchors = [...main.querySelectorAll('.rk-journey-anchor')];
  const floatingMark = main.querySelector('.rk-floating-mark');
  let journeyPathLength = 0;
  let journeyPoints = [];
  let journeyAnchorThresholds = [];
  let scrollFrame = 0;
  const clamp = value => Math.min(1, Math.max(0, value));

  function getJourneyPoint(anchor) {
    const rect = anchor.getBoundingClientRect();
    const sectionRect = journeySection.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - sectionRect.left, y: rect.top + rect.height / 2 - sectionRect.top };
  }

  function layoutJourneyPath() {
    if (!journeySection || !journeyPath || !journeyPathLine || journeyAnchors.length < 2) return;

    const width = Math.max(1, journeySection.clientWidth);
    const height = Math.max(1, journeySection.clientHeight);
    journeyPoints = journeyAnchors.map(getJourneyPoint);
    journeyPath.setAttribute('viewBox', `0 0 ${width} ${height}`);
    journeyPath.setAttribute('preserveAspectRatio', 'none');

    const forceMobile = document.documentElement.classList.contains('rqke-force-mobile');
    const visualWidth = window.visualViewport?.width ?? window.innerWidth;
    const isMobileJourney = forceMobile || visualWidth <= 1100 || matchMedia('(max-width: 900px) and (max-height: 520px)').matches;

    let d = `M ${journeyPoints[0].x.toFixed(2)} ${journeyPoints[0].y.toFixed(2)}`;
    const segmentDefs = [];

    for (let index = 1; index < journeyPoints.length; index += 1) {
      const previous = journeyPoints[index - 1];
      const current = journeyPoints[index];
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      let segment = '';

      if (isMobileJourney) {
        // Markers sit on the card border. The curve bows only into the free
        // gutter, then returns to the next card border marker.
        const borderX = Math.min(previous.x, current.x);
        const directionBias = index % 2 ? 1 : 0;
        const amplitude = 15 + directionBias * 5;
        const controlX = Math.max(8, borderX - amplitude);
        const midY = previous.y + dy / 2;
        segment = `C ${previous.x.toFixed(2)} ${(previous.y + dy * .16).toFixed(2)}, ${controlX.toFixed(2)} ${(previous.y + dy * .25).toFixed(2)}, ${controlX.toFixed(2)} ${midY.toFixed(2)} C ${controlX.toFixed(2)} ${(current.y - dy * .25).toFixed(2)}, ${current.x.toFixed(2)} ${(current.y - dy * .16).toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      } else {
        const direction = dx === 0 ? (index % 2 ? 1 : -1) : Math.sign(dx);
        const horizontalBend = dx === 0
          ? Math.min(width * .13, 190)
          : Math.max(110, Math.min(Math.abs(dx) * .5, 300));
        const c1x = previous.x + horizontalBend * direction;
        const c2x = current.x - horizontalBend * direction;
        const c1y = previous.y + dy * .3;
        const c2y = current.y - dy * .3;
        segment = `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      }

      d += ` ${segment}`;
      segmentDefs.push({ previous, segment });
    }

    journeyPathLine.setAttribute('d', d);
    journeyPathLength = journeyPathLine.getTotalLength();
    journeyPathLine.style.strokeDasharray = `${journeyPathLength}`;
    journeyPathLine.style.strokeDashoffset = `${journeyPathLength}`;

    // Compute the exact path-length moment at which every marker is reached.
    // This keeps dots hidden until the animated line actually arrives there.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.setAttribute('fill', 'none');
    probe.setAttribute('visibility', 'hidden');
    journeyPath.appendChild(probe);
    let cumulative = 0;
    const cumulativeLengths = [0];
    for (const { previous, segment } of segmentDefs) {
      probe.setAttribute('d', `M ${previous.x} ${previous.y} ${segment}`);
      cumulative += probe.getTotalLength();
      cumulativeLengths.push(cumulative);
    }
    probe.remove();
    journeyAnchorThresholds = cumulativeLengths.map(length => journeyPathLength ? length / journeyPathLength : 0);

    if (reducedMotion) {
      journeySection.classList.remove('rk-journey-path-ready');
      journeyPathLine.style.strokeDashoffset = '0';
      journeyAnchors.forEach(anchor => anchor.removeAttribute('data-reached'));
      return;
    }

    journeySection.classList.add('rk-journey-path-ready');
    updateJourneyDrawing();
  }

  function updateJourneyDrawing() {
    if (!journeySection || !journeyPathLine || !journeyPathLength || journeyPoints.length < 2 || reducedMotion) return;
    const sectionTop = journeySection.getBoundingClientRect().top;
    const startY = sectionTop + journeyPoints[0].y;
    const endY = sectionTop + journeyPoints[journeyPoints.length - 1].y;
    const triggerY = innerHeight * .9;
    const progress = clamp((triggerY - startY) / Math.max(1, endY - startY));
    journeySection.style.setProperty('--journey-progress', String(progress));
    journeyPathLine.style.strokeDashoffset = `${journeyPathLength * (1 - progress)}`;

    journeyAnchors.forEach((anchor, index) => {
      const threshold = journeyAnchorThresholds[index] ?? 1;
      const reached = progress >= Math.max(0, threshold - .012) && (index !== 0 || progress > .002);
      anchor.setAttribute('data-reached', String(reached));
    });
  }

  function updateScrollEffects() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const range = Math.max(1, hero.offsetHeight - innerHeight);
        hero.style.setProperty('--hero-progress', String(clamp(-rect.top / range)));
        const visible = rect.bottom <= 150;
        rail?.setAttribute('data-visible', String(visible));
        rail?.setAttribute('aria-hidden', String(!visible));
        if (rail) rail.inert = !visible;
      }
      updateJourneyDrawing();
      updateProjectRailFromPage();
      const active = sectionIds.find(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return rect.top <= innerHeight * .4 && rect.bottom > innerHeight * .4;
      });
      if (active) {
        floatingMark?.setAttribute('data-scene', active);
        rail?.setAttribute('data-theme', ['projects', 'services'].includes(active) ? 'dark' : 'light');
        main.querySelectorAll('.rk-rail-nav a, .rk-mobile-menu nav a').forEach(link => {
          if (link.getAttribute('href') === '#' + active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }
  addEventListener('scroll', updateScrollEffects, { passive: true });
  addEventListener('resize', () => {
    layoutJourneyPath();
    updateScrollEffects();
  });
  if ('ResizeObserver' in window && journeySection) {
    const journeyResizeObserver = new ResizeObserver(() => requestAnimationFrame(() => {
      layoutJourneyPath();
      updateScrollEffects();
    }));
    journeyResizeObserver.observe(journeySection);
  }
  document.fonts?.ready.then(() => requestAnimationFrame(() => {
    layoutJourneyPath();
    updateScrollEffects();
  }));

  const revealNodes = [...main.querySelectorAll('[data-reveal]')];
  if (reducedMotion) revealNodes.forEach(node => node.setAttribute('data-visible','true'));
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.setAttribute('data-visible','true'); revealObserver.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealNodes.forEach(node => revealObserver.observe(node));
  }

  const dialog = main.querySelector('.rk-journey-dialog');
  let journeyTrigger = null;
  function closeJourney() { if (dialog?.open) dialog.close(); requestAnimationFrame(() => journeyTrigger?.focus()); }
  main.querySelectorAll('.rk-journey-card').forEach(card => card.querySelector('button')?.addEventListener('click', event => {
    const index = Number(card.dataset.journeyIndex);
    const item = copy.journey[index];
    journeyTrigger = event.currentTarget;
    dialog.innerHTML = `<div><button type="button" aria-label="${copy.closeDetails}">${icons.close}</button><p>${item.marker} / ${item.label}</p><h2 id="rk-dialog-title">${item.title}</h2><p>${item.detail}</p><span>rqke / STRUCTURE × LOGIC × DEVELOPMENT</span></div>`;
    fixRuTypography(dialog);
    dialog.querySelector('button')?.addEventListener('click', closeJourney);
    dialog.showModal();
    dialog.querySelector('button')?.focus();
  }));
  dialog?.addEventListener('cancel', event => { event.preventDefault(); closeJourney(); });
  dialog?.addEventListener('click', event => { if (event.target === dialog) closeJourney(); });

  const railSection = main.querySelector('.projects-rail-section');
  const projectViewport = main.querySelector('.project-rail-viewport');
  const projectTrack = main.querySelector('.project-rail-track');
  const projectCards = [...main.querySelectorAll('.project-rail-card')];
  const projectCounter = main.querySelector('.projects-rail-counter');
  let scrollActive = 0;
  let hovered = null;
  const compact = matchMedia('(max-width: 1100px), (max-height: 639px)');
  function setProjectActive(index) {
    scrollActive = Math.min(projectCards.length - 1, Math.max(0, index));
    const display = hovered ?? scrollActive;
    projectCards.forEach((card, cardIndex) => card.setAttribute('data-active', String(cardIndex === display)));
    projectTrack?.setAttribute('data-has-focus', String(hovered !== null));
    if (projectCounter) projectCounter.textContent = `${String(display + 1).padStart(2,'0')} / ${String(projectCards.length).padStart(2,'0')}`;
  }
  projectCards.forEach((card,index) => {
    card.addEventListener('pointerenter', () => { hovered = index; setProjectActive(scrollActive); });
    card.addEventListener('pointerleave', () => { hovered = null; setProjectActive(scrollActive); });
    card.addEventListener('focus', () => { hovered = index; setProjectActive(scrollActive); });
    card.addEventListener('blur', () => { hovered = null; setProjectActive(scrollActive); });
  });
  function updateProjectRailFromPage() {
    if (!railSection || !projectTrack) return;
    let pinned = !compact.matches && !reducedMotion && !document.documentElement.classList.contains('rqke-force-mobile');
    railSection.dataset.scrollRail = String(pinned);
    if (pinned && projectCards.some(card => card.querySelector('.project-rail-copy').offsetHeight + 145 > card.clientHeight)) {
      pinned = false;
      railSection.dataset.scrollRail = 'false';
    }
    if (!pinned) {
      railSection.style.setProperty('--rail-x', '0px');
      railSection.style.setProperty('--rail-progress', '0');
      return;
    }
    const travel = Math.max(0, projectTrack.scrollWidth - projectViewport.clientWidth);
    railSection.style.setProperty('--rail-height', `${innerHeight + Math.max(innerHeight * 1.4, travel * 1.6)}px`);
    const range = Math.max(1, railSection.offsetHeight - innerHeight);
    const progress = clamp(-railSection.getBoundingClientRect().top / range);
    railSection.style.setProperty('--rail-x', `${-progress * travel}px`);
    railSection.style.setProperty('--rail-progress', String(progress));
    setProjectActive(Math.round(progress * Math.max(0, projectCards.length - 1)));
  }
  projectViewport?.addEventListener('scroll', () => {
    if (railSection.dataset.scrollRail === 'true') return;
    requestAnimationFrame(() => {
      const viewportLeft = projectViewport.getBoundingClientRect().left;
      const closest = projectCards.reduce((best, card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - viewportLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index:0, distance:Infinity });
      setProjectActive(closest.index);
    });
  }, { passive: true });

  projectCards.forEach(card => card.addEventListener('focus', () => {
    if (railSection.dataset.scrollRail !== 'true') return;
    const travel = Math.max(1, projectTrack.scrollWidth - projectViewport.clientWidth);
    const offset = card.offsetLeft - projectCards[0].offsetLeft;
    const top = railSection.getBoundingClientRect().top + scrollY + clamp(offset / travel) * (railSection.offsetHeight - innerHeight);
    scrollTo({ top, behavior: 'instant' });
  }));

  const bookingToggle = main.querySelector('#booking-toggle');
  const bookingPanel = main.querySelector('#booking-panel');
  let bookingCloseTimer;
  function setBooking(open, focus = true) {
    if (!bookingEnabled || !bookingPanel) return;
    clearTimeout(bookingCloseTimer);
    if (open) {
      bookingOpen = true;
      delete bookingPanel.dataset.closing;
      bookingToggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('booking-open');
      if (floatingMark) floatingMark.hidden = true;
      if (!bookingPanel.open) bookingPanel.showModal();
      requestAnimationFrame(() => {
        if (!bookingPanel.open) return;
        mountCalBooking(bookingPanel.querySelector('.booking-frame'), {
          calLink: booking.calLink,
          language,
          title: contactText.iframeTitle,
          onLoad: () => { bookingPanel.querySelector('.booking-loading').hidden = true; }
        });
      });
    } else if (bookingPanel.open) {
      bookingPanel.dataset.closing = 'true';
      bookingCloseTimer = setTimeout(() => bookingPanel.close(), reducedMotion ? 0 : 180);
    }
    if (open && focus) bookingPanel.querySelector('h3').focus();
    if (open && focus) track('booking_open');
  }
  bookingToggle?.addEventListener('click', () => setBooking(!bookingOpen));
  main.querySelector('.booking-close')?.addEventListener('click', () => setBooking(false));
  bookingPanel?.addEventListener('cancel', event => {
    event.preventDefault(); setBooking(false);
  });
  bookingPanel?.addEventListener('close', () => {
    clearTimeout(bookingCloseTimer);
    delete bookingPanel.dataset.closing;
    bookingOpen = false;
    bookingToggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('booking-open');
    if (floatingMark) floatingMark.hidden = false;
    bookingToggle.focus({ preventScroll: true });
  });
  bookingPanel?.addEventListener('click', event => {
    if (event.target !== bookingPanel) return;
    const rect = bookingPanel.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setBooking(false);
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link?.href.startsWith(telegram)) track('telegram_click');
    if (link?.classList.contains('booking-external')) track('booking_external_click');
  });
  const form = main.querySelector('.contact-form');
  try {
    const draft = JSON.parse(sessionStorage.getItem('rqke-brief-draft') || 'null');
    if (draft && form) {
      for (const [key, value] of Object.entries(draft.fields)) if (form.elements[key]) form.elements[key].value = value;
      main.querySelector('.brief-details').open = Boolean(draft.open);
    }
  } catch { sessionStorage.removeItem('rqke-brief-draft'); }
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const payload = Object.fromEntries([...new FormData(form)].map(([key,value]) => [key, String(value).trim()]));
    let firstInvalid;
    for (const key of ['description', 'contact']) {
      const field = form.elements[key];
      const invalid = !payload[key];
      field.setAttribute('aria-invalid', String(invalid));
      const message = form.querySelector('#' + key + '-error');
      message.textContent = contactText[key + 'Error'];
      message.hidden = !invalid;
      if (invalid && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) {
      const error = form.querySelector('.form-error');
      error.hidden = false;
      error.textContent = contactText[firstInvalid.name + 'Error'];
      firstInvalid.focus(); return;
    }
    form.querySelector('.form-error').hidden = true;
    const brief = [contactText.briefTitle, ...['name','contact','company','budget','deadline'].filter(key => payload[key]).map(key => contactText[key] + ': ' + payload[key]), '', contactText.description, payload.description].join('\n');
    const briefNode = document.createElement('div');
    briefNode.className = 'contact-brief';
    briefNode.innerHTML = `${icons.check}<h3 tabindex="-1">${contactText.ready}</h3><p>${contactText.readyText}</p><pre tabindex="0"></pre><div><a href="${telegram}?text=${encodeURIComponent(brief)}" target="_blank" rel="noopener noreferrer">${icons.send}${contactText.sendTelegram}</a><button type="button" class="copy-brief">${icons.clipboard}<span>${contactText.copy}</span></button></div><p class="copy-status" role="status"></p><button class="contact-edit" type="button">${contactText.edit}</button>`;
    briefNode.querySelector('pre').textContent = brief;
    form.hidden = true;
    form.after(briefNode);
    fixRuTypography(briefNode);
    briefNode.querySelector('h3').focus();
    track('brief_created');
    briefNode.querySelector('.copy-brief').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(brief); briefNode.querySelector('.copy-status').textContent = contactText.copied; track('brief_copied'); }
      catch { briefNode.querySelector('.copy-status').textContent = contactText.copyError; }
    });
    briefNode.querySelector('.contact-edit').addEventListener('click', () => {
      briefNode.remove(); form.hidden = false; form.elements.description.focus();
    });
  });

  const mobileLayout = matchMedia('(max-width: 1100px)');
  function scrollToSection(hash, behavior = 'smooth', updateHistory = true) {
    let id = decodeURIComponent(String(hash || '').replace(/^#/, ''));
    if (id === 'testimonial') id = 'collaboration';
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    if (id === 'contact') track('contact_open');
    const offset = mobileLayout.matches ? 70 : 0;
    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + scrollY - offset) + 2);
    if (updateHistory) {
      const nextHash = `#${encodeURIComponent(id)}`;
      if (location.hash !== nextHash) history.pushState(null, '', nextHash);
    }
    scrollTo({ top, behavior: reducedMotion || behavior === 'auto' ? 'instant' : behavior });
    return true;
  }

  main.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (!document.getElementById(decodeURIComponent(href.slice(1)))) return;
    event.preventDefault();
    setMobileMenu(false);
    scrollToSection(href, 'smooth', true);
  });

  addEventListener('popstate', () => {
    if (location.hash) scrollToSection(location.hash, 'auto', false);
  });

  const restorePageState = () => requestAnimationFrame(() => {
    setMobileMenu(false);
    layoutJourneyPath();
    updateScrollEffects();
  });
  addEventListener('pageshow', restorePageState);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restorePageState();
  });

  if (location.hash) {
    scrollToSection(location.hash, 'auto', false);
    document.fonts?.ready.then(() => requestAnimationFrame(() => scrollToSection(location.hash, 'auto', false)));
  }
  layoutJourneyPath();
  updateScrollEffects();
})();
