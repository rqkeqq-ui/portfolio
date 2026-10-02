import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';
import { renderProjectCard, mountProjectCards } from './cards/projectCard.js';

(() => {
  'use strict';
  const { language, internal, root, icons } = RQKE;
  const data = RQKE_DATA;
  const main = document.getElementById('main');
  if (!main) return;

  const lang = language();
  const projects = data.projects.map(project => data.localizeProject(project, lang));
  const copy = {
    ru: { title:'Проекты', description:'Личные проекты rqke / SYSTEMS: онлайн-запись, расписание, каталог и учёт.', eyebrow:'АРХИВ', unit:'ПРОЕКТ', heading:'Продукты и<br><em>системы.</em>', lead:'Посмотрите, какие задачи решают проекты и как устроены основные сценарии. В каждом кейсе указаны моя роль, реализованные возможности и ограничения текущей версии.', question:'Нужна похожая система?', cta:'Обсудить задачу ↗', all:'Все', filter:'Фильтр проектов', empty:'В этой категории проектов пока нет.', show:'Показать все' },
    en: { title:'Projects', description:'Personal projects by rqke / SYSTEMS: online booking, schedules, catalogues and records.', eyebrow:'ARCHIVE', unit:'PROJECTS', heading:'Products and<br><em>systems.</em>', lead:'Explore each project’s needs, core journeys, my role, implemented features and current limitations.', question:'Need a similar system?', cta:'Discuss your needs ↗', all:'All', filter:'Project filter', empty:'There are no projects in this category yet.', show:'Show all' }
  }[lang];
  const ruPlural = (n, [one, few, many]) => {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  };
  const categories = ['All','Landing Page','Web Application'];
  const asset = src => root(src.replace(/^\/images\//, 'assets/images/'));
  const escape = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  let filter = (() => {
    const value = new URLSearchParams(location.search).get('category');
    return categories.includes(value) ? value : 'All';
  })();

  document.title = `${copy.title} — rqke / SYSTEMS`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', copy.description);

  main.className = 'projects-page';
  main.innerHTML = `<header class="projects-hero"><p class="eyebrow">${copy.eyebrow} / ${String(projects.length).padStart(2,'0')} ${lang === 'ru' ? ruPlural(projects.length, ['ПРОЕКТ', 'ПРОЕКТА', 'ПРОЕКТОВ']) : copy.unit}</p><h1>${copy.heading}</h1><p>${copy.lead}</p></header><section class="section projects-archive"><div class="filter-bar" aria-label="${copy.filter}"></div><div class="pc-archive all-project-list"></div></section><section class="archive-cta"><p>${copy.question}</p><a href="${internal('index.html#contact',lang)}">${copy.cta}</a></section>`;

  const filterBar = main.querySelector('.filter-bar');
  const list = main.querySelector('.all-project-list');

  function projectCard(project, index) {
    return renderProjectCard(project, {
      index,
      href: internal(`projects/${project.slug}/`, lang),
      asset,
      label: lang === 'ru' ? 'Посмотреть кейс' : 'View case study',
      meta: `${data.formatCategory(project.category, lang)} · ${project.kind || project.year}`,
      arrow: icons.arrowUpRight
    });
  }

  function renderFilters() {
    filterBar.innerHTML = categories.map(category => `<button type="button" data-category="${category}" aria-pressed="${filter===category}">${category === 'All' ? copy.all : data.formatCategory(category,lang)}</button>`).join('');
    filterBar.querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.category)));
  }

  function renderList() {
    const visible = filter === 'All' ? projects : projects.filter(project => project.category === filter);
    list.innerHTML = visible.length ? visible.map(project => projectCard(project, projects.indexOf(project))).join('') : `<div class="empty-projects"><p>${copy.empty}</p><button type="button">${copy.show}</button></div>`;
    list.querySelector('.empty-projects button')?.addEventListener('click', () => select('All'));
    mountProjectCards(list, { asset });
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
