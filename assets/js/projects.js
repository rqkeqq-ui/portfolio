import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';

(() => {
  'use strict';
  const { language, internal, root, icons } = RQKE;
  const data = RQKE_DATA;
  const main = document.getElementById('main');
  if (!main) return;

  const lang = language();
  const projects = data.projects.map(project => data.localizeProject(project, lang));
  const copy = {
    ru: { title:'Проекты', description:'Цифровые продукты и системы rqke / SYSTEMS.', eyebrow:'АРХИВ', unit:'ПРОЕКТА', heading:'Продукты и<br><em>системы.</em>', lead:'Каждый кейс показывает контекст, задачу, архитектуру решения, реализацию и полученный результат.', question:'Нужна похожая система?', cta:'Обсудить проект ↗', all:'Все', filter:'Фильтр проектов', empty:'В этой категории проектов пока нет.', show:'Показать все' },
    en: { title:'Projects', description:'Digital products and systems by rqke / SYSTEMS.', eyebrow:'ARCHIVE', unit:'PROJECTS', heading:'Products and<br><em>systems.</em>', lead:'Each case explains the context, the problem, the solution architecture, the implementation and the result.', question:'Need a similar system?', cta:'Discuss a project ↗', all:'All', filter:'Project filter', empty:'There are no projects in this category yet.', show:'Show all' }
  }[lang];
  const categories = ['All','Landing Page','Business Website','Web Application'];
  const asset = src => root(src.replace(/^\/images\//, 'assets/images/'));
  const escape = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  let filter = (() => {
    const value = new URLSearchParams(location.search).get('category');
    return categories.includes(value) ? value : 'All';
  })();

  document.title = `${copy.title} — rqke / SYSTEMS`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', copy.description);

  main.className = 'projects-page';
  main.innerHTML = `<header class="projects-hero"><p class="eyebrow">${copy.eyebrow} / ${String(projects.length).padStart(2,'0')} ${copy.unit}</p><h1>${copy.heading}</h1><p>${copy.lead}</p></header><section class="section projects-archive"><div class="filter-bar" aria-label="${copy.filter}"></div><div class="project-list all-project-list"></div></section><section class="archive-cta"><p>${copy.question}</p><a href="${internal('index.html#contact',lang)}">${copy.cta}</a></section>`;

  const filterBar = main.querySelector('.filter-bar');
  const list = main.querySelector('.all-project-list');

  function projectCard(project, index) {
    const href = internal(`projects/${project.slug}/`, lang);
    const open = lang === 'ru' ? 'Смотреть кейс' : 'View case study';
    return `<article class="project-card"><a href="${href}" class="project-cover" aria-label="${open}: ${escape(project.title)}"><img src="${asset(project.coverImage.src)}" alt="${escape(project.coverImage.alt)}" width="${project.coverImage.width}" height="${project.coverImage.height}" loading="${index === 0 ? 'eager':'lazy'}"><span class="project-view">${open.toUpperCase()} ${icons.arrowUpRight}</span></a><div class="project-meta"><span class="project-number">${String(index+1).padStart(2,'0')}</span><div><p>${data.formatCategory(project.category,lang)} / ${data.formatStatus(project.status,lang)}</p><h3><a href="${href}">${escape(project.title)}</a></h3><p class="project-description">${escape(project.shortDescription)}</p><div class="tag-list">${project.stack.slice(0,5).map(item => `<span>${escape(item)}</span>`).join('')}</div></div><span class="project-year">${escape(project.year)}</span></div></article>`;
  }

  function renderFilters() {
    filterBar.innerHTML = categories.map(category => `<button type="button" data-category="${category}" aria-pressed="${filter===category}">${category === 'All' ? copy.all : data.formatCategory(category,lang)}</button>`).join('');
    filterBar.querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.category)));
  }

  function renderList() {
    const visible = filter === 'All' ? projects : projects.filter(project => project.category === filter);
    list.innerHTML = visible.length ? visible.map(project => projectCard(project, projects.indexOf(project))).join('') : `<div class="empty-projects"><p>${copy.empty}</p><button type="button">${copy.show}</button></div>`;
    list.querySelector('.empty-projects button')?.addEventListener('click', () => select('All'));
  }

  function select(category) {
    filter = category;
    const url = new URL(location.href);
    if (category === 'All') url.searchParams.delete('category'); else url.searchParams.set('category', category);
    history.replaceState({},'',url);
    renderFilters(); renderList();
  }

  renderFilters(); renderList();
})();
