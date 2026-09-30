import { RQKE } from './core.js';
import { RQKE_DATA } from './data.js';

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
  const escape = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const text = {
    ru: { all:'Все проекты', facts:['Категория','Статус','Роль','Стек'], overview:'Что создано', goals:'Цели первой версии', functionality:'Реализованные сценарии', interface:'Система в работе', galleryHint:'Нажмите на изображение, чтобы открыть полноэкранный просмотр.', architecture:'Как устроен проект', decisions:'Сложности и решения', problem:'Проблема', solution:'Решение', result:'Результат', nextSteps:'Возможное развитие', nextLead:'Эти возможности не входят в текущую версию и отделены от реализованного функционала.', projectNav:'Навигация между проектами', previous:'← Предыдущий', next:'Следующий →', question:'Нужен похожий сервис?', finalTitle:'Расскажите, как должен работать ваш процесс. Обсудим, что нужно в первой версии.', cta:'Обсудить задачу', enlarge:'Увеличить изображение', viewer:'Просмотр изображения', close:'Закрыть', prevImage:'Предыдущее изображение', nextImage:'Следующее изображение' },
    en: { all:'All projects', facts:['Category','Status','Role','Stack'], overview:'What was built', goals:'Goals for version one', functionality:'Implemented journeys', interface:'The system in action', galleryHint:'Select an image to open the full-screen viewer.', architecture:'How the project works', decisions:'Challenges and decisions', problem:'Problem', solution:'Solution', result:'Result', nextSteps:'Possible development', nextLead:'These capabilities are outside the current version and are kept separate from implemented functionality.', projectNav:'Project navigation', previous:'← Previous', next:'Next →', question:'Need a similar service?', finalTitle:'Tell me how your process should work. We will discuss what the first version needs.', cta:'Discuss your needs', enlarge:'Enlarge image', viewer:'Image viewer', close:'Close', prevImage:'Previous image', nextImage:'Next image' }
  }[lang];

  document.title = `${project.title} — rqke / SYSTEMS`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', project.shortDescription);

  main.className = 'case-page';
  main.innerHTML = `
    <section class="case-hero"><a href="${internal('projects/',lang)}" class="case-back">${icons.arrowLeft} ${text.all}</a><div class="case-title"><p class="eyebrow">PROJECT ${String(index+1).padStart(2,'0')} / ${project.year}</p><h1>${escape(project.title)}</h1><p>${escape(project.subtitle)}</p></div><dl class="case-facts"><div><dt>${text.facts[0]}</dt><dd>${data.formatCategory(project.category,lang)}</dd></div><div><dt>${text.facts[1]}</dt><dd>${data.formatStatus(project.status,lang)}</dd></div><div><dt>${text.facts[2]}</dt><dd>${data.formatRole(project.role,lang)}</dd></div><div><dt>${text.facts[3]}</dt><dd>${project.stack.map(escape).join(' · ')}</dd></div></dl><div class="case-links">${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" rel="noreferrer">${lang === 'ru' ? 'Посмотреть демонстрацию' : 'View demonstration'} ${icons.arrowUpRight}</a>`:''}${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" rel="noreferrer">GitHub ${icons.arrowUpRight}</a>`:''}</div></section>
    <section class="case-section case-overview"><p class="eyebrow">01 / CONTEXT</p><h2>${lang === 'ru' ? 'Задача проекта' : 'Project needs'}</h2><p class="case-lead">${escape(project.task)}</p><h3>${text.overview}</h3><p>${escape(project.fullDescription)}</p></section>
    <section class="case-section case-goals"><p class="eyebrow">02 / SCENARIO</p><h2>${lang === 'ru' ? 'Как работает основной сценарий' : 'How the main journey works'}</h2><ol>${project.scenario.map((step,i)=>`<li><span>0${i+1}</span>${escape(step)}</li>`).join('')}</ol><h3>${lang === 'ru' ? 'Функциональный результат' : 'Functional result'}</h3><p class="case-lead">${escape(project.result)}</p></section>
    <div class="case-demo-cover"><div class="case-cover"><img src="${asset(project.coverImage.src)}" alt="${escape(project.coverImage.alt)}" width="${project.coverImage.width}" height="${project.coverImage.height}"></div></div>
    <section class="case-section case-features"><p class="eyebrow">03 / FUNCTIONALITY</p><h2>${text.functionality}</h2><div class="feature-grid">${project.features.map((feature,i)=>`<article><span>0${i+1}</span><h3>${escape(feature.title)}</h3><p>${escape(feature.description)}</p></article>`).join('')}</div></section>
    <section class="case-gallery-section"><div class="case-section-heading"><p class="eyebrow">04 / INTERFACE</p><h2>${text.interface}</h2><p>${text.galleryHint}</p></div><div class="case-gallery">${project.gallery.map((image,i)=>`<figure><button type="button" data-gallery-index="${i}" aria-label="${text.enlarge}: ${escape(image.alt)}"><img src="${asset(image.src)}" alt="${escape(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy"></button>${image.caption ? `<figcaption>${String(i+1).padStart(2,'0')} / ${escape(image.caption)}</figcaption>`:''}</figure>`).join('')}</div></section>
    <section class="case-section case-architecture"><p class="eyebrow">05 / ARCHITECTURE</p><h2>${text.architecture}</h2><div class="architecture-flow">${project.architecture.map((layer,i)=>`<div><span>0${i+1}</span><h3>${escape(layer.title)}</h3><p>${escape(layer.description)}</p></div>`).join('')}</div></section>
    <section class="case-section case-challenges"><p class="eyebrow">06 / DECISIONS</p><h2>${text.decisions}</h2>${project.challenges.map(challenge=>`<article><h3>${escape(challenge.title)}</h3><div><p><strong>${text.problem}</strong>${escape(challenge.problem)}</p><p><strong>${text.solution}</strong>${escape(challenge.solution)}</p>${challenge.result ? `<p><strong>${text.result}</strong>${escape(challenge.result)}</p>`:''}</div></article>`).join('')}</section>
    <section class="case-section case-limitations"><p class="eyebrow">07 / LIMITATIONS</p><h2>${lang === 'ru' ? 'Ограничения текущей версии' : 'Current limitations'}</h2><p class="case-lead">${escape(project.limitations)}</p></section>
    <section class="case-section future-section"><div><p class="eyebrow">08 / NEXT</p><h2>${text.nextSteps}</h2><p>${text.nextLead}</p></div><ul>${project.futureFeatures.map(feature=>`<li>${escape(feature)}</li>`).join('')}</ul></section>
    <nav class="project-navigation" aria-label="${text.projectNav}"><a href="${internal(`projects/${previous.slug}/`,lang)}"><span>${text.previous}</span><strong>${escape(previous.title)}</strong></a><a href="${internal(`projects/${next.slug}/`,lang)}"><span>${text.next}</span><strong>${escape(next.title)}</strong></a></nav>
    <section class="case-final-cta"><p>${text.question}</p><h2>${text.finalTitle}</h2><a href="${internal('index.html#contact',lang)}">${text.cta} ${icons.arrowUpRight}</a></section>`;

  let active = null;
  let trigger = null;
  let lightbox = null;
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove(); lightbox = null; document.body.style.overflow = ''; trigger?.focus();
  }
  function openLightbox(indexValue, sourceButton) {
    active = indexValue; trigger = sourceButton;
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox'; lightbox.setAttribute('role','dialog'); lightbox.setAttribute('aria-modal','true'); lightbox.setAttribute('aria-label',text.viewer);
    document.body.style.overflow = 'hidden';
    renderLightbox();
    document.body.append(lightbox);
    lightbox.querySelector('.lightbox-close')?.focus();
  }
  function renderLightbox() {
    const image = project.gallery[active];
    lightbox.innerHTML = `<button class="lightbox-close" type="button" aria-label="${text.close}">${icons.close}</button><button class="lightbox-prev" type="button" aria-label="${text.prevImage}">${icons.arrowLeft}</button><figure><img src="${asset(image.src)}" alt="${escape(image.alt)}" width="${image.width}" height="${image.height}"><figcaption>${active+1} / ${project.gallery.length} — ${escape(image.caption || image.alt)}</figcaption></figure><button class="lightbox-next" type="button" aria-label="${text.nextImage}">${icons.arrowRight}</button>`;
    lightbox.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click',()=>{ active=(active-1+project.gallery.length)%project.gallery.length; renderLightbox(); });
    lightbox.querySelector('.lightbox-next').addEventListener('click',()=>{ active=(active+1)%project.gallery.length; renderLightbox(); });
  }
  main.querySelectorAll('[data-gallery-index]').forEach(button=>button.addEventListener('click',()=>openLightbox(Number(button.dataset.galleryIndex),button)));
  addEventListener('keydown', event => {
    if (!lightbox) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') { active=(active+1)%project.gallery.length; renderLightbox(); }
    if (event.key === 'ArrowLeft') { active=(active-1+project.gallery.length)%project.gallery.length; renderLightbox(); }
  });
})();
