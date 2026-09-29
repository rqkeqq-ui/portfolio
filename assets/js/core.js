import { RQKE_DATA } from './data.js';


  const body = document.body;
  const rootPrefix = body.dataset.root || '.';

  const icons = {
    arrowUpRight: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowLeft: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowRight: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6M5 12h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowDown: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m0 0 6-6m-6 6-6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    send: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M22 2 11 13" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    clipboard: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 4.5V3h6v1.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    github: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .7A11.5 11.5 0 0 0 8.4 23c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.4-4.1-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .7Z"/></svg>',
    telegram: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.7 3.4 18.5 19c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.4-.1-.6-.6-.2L6.1 12.8 1.3 11.3c-1-.3-1.1-1 .2-1.5L20.2 2.6c.9-.3 1.7.2 1.5.8Z"/></svg>',
    globe: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    database: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    app: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h18M7 6h.01M10 6h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    workflow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="15" y="15" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 6h4a3 3 0 0 1 3 3v6M15 18h-4a3 3 0 0 1-3-3V9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
  };

  const root = (path = '') => {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(path)) return path;
    const clean = path.replace(/^\/+/, '');
    return `${rootPrefix}/${clean}`.replace(/\/\.\//g, '/');
  };

  const language = () => new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ru';

  const withLanguage = (href, lang = language()) => {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) return href;
    const [base, hash = ''] = href.split('#');
    const url = new URL(base || location.pathname, location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    return `${url.pathname}${url.search}${hash ? `#${hash}` : ''}`;
  };

  const switchLanguage = () => {
    const url = new URL(location.href);
    if (language() === 'ru') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  const rolling = (label) => `<span class="rk-roll"><span class="rk-roll-copy" aria-hidden="true">${label}</span><span class="rk-roll-copy" aria-hidden="true">${label}</span><span class="rk-sr-only">${label}</span></span>`;

  const chromeCopy = {
    ru: {
      nav: [['Работы', 'projects/'], ['Направления', 'index.html#services'], ['Подход', 'index.html#about'], ['Возможности', 'index.html#overview'], ['Контакты', 'index.html#contact']],
      home: 'rqke / SYSTEMS — главная', navLabel: 'Основная навигация', cta: 'Обсудить проект', open: 'Открыть меню', close: 'Закрыть меню', switchLabel: 'Переключить язык на английский',
      tagline: 'Разработчик цифровых решений', projects: 'Проекты', services: 'Направления', contact: 'Контакты', made: 'Спроектировано и разработано независимо', footerNav: 'Ссылки в подвале'
    },
    en: {
      nav: [['Work', 'projects/'], ['Services', 'index.html#services'], ['Approach', 'index.html#about'], ['Outcomes', 'index.html#overview'], ['Contact', 'index.html#contact']],
      home: 'rqke / SYSTEMS — homepage', navLabel: 'Primary navigation', cta: 'Discuss a project', open: 'Open menu', close: 'Close menu', switchLabel: 'Switch language to Russian',
      tagline: 'Independent Developer', projects: 'Projects', services: 'Services', contact: 'Contact', made: 'Designed and developed independently', footerNav: 'Footer links'
    }
  };

  function internal(path, lang) {
    const target = root(path);
    const [base, hash = ''] = target.split('#');
    const url = new URL(base, location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    return `${url.pathname}${url.search}${hash ? `#${hash}` : ''}`;
  }

  function fixRuTypography(rootNode = document.body) {
    if (language() !== 'ru' || !rootNode) return;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION', 'CODE', 'PRE'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return /(^|\s)[вксуоиаё]\s+/i.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      node.nodeValue = node.nodeValue.replace(/(^|\s)([вксуоиаё])\s+(?=\S)/gi, '$1$2\u00A0');
    });
  }

  function renderChrome() {
    if (body.classList.contains('home-page')) return;
    const lang = language();
    const text = chromeCopy[lang];
    const data = RQKE_DATA || { links: [] };
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <a class="brand" href="${internal('index.html', lang)}" aria-label="${text.home}"><span>rqke</span><i>/</i><span>SYSTEMS</span></a>
      <nav class="desktop-nav" aria-label="${text.navLabel}">${text.nav.map(([label, href]) => `<a href="${internal(href, lang)}">${label}</a>`).join('')}</nav>
      <div class="header-actions">
        ${data.links.filter(link => link.id === 'github' || link.id === 'telegram').map(link => `<a class="header-social" href="${link.url}" target="_blank" rel="noreferrer" aria-label="${link.label}" title="${link.label}">${link.id === 'github' ? icons.github : icons.telegram}</a>`).join('')}
        <button class="site-language" type="button" aria-label="${text.switchLabel}">${lang === 'ru' ? 'EN' : 'RU'}</button>
        <a class="header-cta" href="${internal('index.html#contact', lang)}">${text.cta} <span aria-hidden="true">↗</span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="${text.open}">${icons.menu}</button>
      </div>
      <div id="mobile-menu" class="mobile-menu" aria-hidden="true"><div class="mobile-menu-inner"><p class="eyebrow">NAVIGATION / 2026</p>${text.nav.map(([label, href], index) => `<a href="${internal(href, lang)}" tabindex="-1"><small>0${index + 1}</small>${label}</a>`).join('')}</div></div>`;
    body.prepend(header);

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="footer-top"><div><p class="brand footer-brand">rqke <i>/</i> SYSTEMS</p><p>${text.tagline}</p></div><nav aria-label="${text.footerNav}"><a href="${internal('projects/', lang)}">${text.projects}</a><a href="${internal('index.html#services', lang)}">${text.services}</a><a href="${internal('index.html#contact', lang)}">${text.contact}</a>${data.links.map(link => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label} ↗</a>`).join('')}</nav></div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} rqke / SYSTEMS</span><span>${text.made}</span><span>STATIC / 01</span></div>`;
    body.append(footer);

    const languageButton = header.querySelector('.site-language');
    languageButton?.addEventListener('click', switchLanguage);
    const toggle = header.querySelector('.menu-toggle');
    const menu = header.querySelector('.mobile-menu');
    const menuLinks = menu?.querySelectorAll('a') || [];
    const setMenu = (open) => {
      toggle?.setAttribute('aria-expanded', String(open));
      toggle?.setAttribute('aria-label', open ? text.close : text.open);
      if (toggle) toggle.innerHTML = open ? icons.close : icons.menu;
      menu?.classList.toggle('is-open', open);
      menu?.setAttribute('aria-hidden', String(!open));
      menuLinks.forEach(link => link.tabIndex = open ? 0 : -1);
      body.style.overflow = open ? 'hidden' : '';
    };
    toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menuLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  }

  function initScrollProgress() {
    let frame = 0;
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available = document.documentElement.scrollHeight - innerHeight;
        const progress = available > 0 ? scrollY / available : 0;
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      });
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
  }

  export const RQKE = { icons, root, language, withLanguage, switchLanguage, rolling, renderChrome, initScrollProgress, internal, fixRuTypography };
  document.documentElement.lang = language();
  addEventListener('DOMContentLoaded', () => { renderChrome(); fixRuTypography(document.body); initScrollProgress(); });
