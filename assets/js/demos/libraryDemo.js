import { escape } from './shell.js';

// Clickable Library Management System shell: demo data only, nothing leaves the page.
const copy = {
  ru: {
    brand: 'Библиотека', brandNote: 'Система управления', reader: 'Иван Петров', admin: 'Библиотекарь', ticket: 'Билет №R10001',
    nav: { catalog: 'Каталог', mybooks: 'Мои книги', requests: 'Мои заявки', admin: 'Управление', books: 'Книги' },
    catalogTitle: 'Каталог книг', searchPh: 'Найти книгу, автора или жанр…', find: 'Найти', allGenres: 'Все жанры',
    available: 'Доступна', issued: 'Выдана', reserved: 'Забронирована', copies: 'экз.', of: 'из', empty: 'Ничего не нашлось. Попробуйте другой запрос.',
    back: 'К каталогу', year: 'Год издания', genre: 'Жанр', author: 'Автор', inStock: 'В наличии', reserve: 'Забронировать', reservedNote: 'Заявка отправлена библиотекарю. Статус — в разделе «Мои заявки».',
    unavailable: 'Сейчас все экземпляры выданы', alreadyRequested: 'Вы уже оставили заявку на эту книгу',
    mybooksTitle: 'Мои книги', due: 'Вернуть до', renew: 'Продлить на 14 дней', renewed: 'Продлено', overdue: 'Просрочено', noBooks: 'Сейчас у вас нет книг на руках.', toCatalog: 'Открыть каталог',
    requestsTitle: 'Мои заявки', status: { pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена' }, noRequests: 'Заявок пока нет.',
    adminTitle: 'Управление', stats: ['Всего книг', 'Выдано', 'Просрочено', 'Новые заявки'],
    newRequests: 'Новые заявки', wants: 'хочет взять', approve: 'Одобрить', reject: 'Отклонить', noPending: 'Новых заявок нет.',
    loansTitle: 'Книги на руках', loansNote: 'Выдача, возврат и продление', accept: 'Принять возврат',
    booksTitle: 'Книжный фонд', addTitle: 'Добавить книгу', titleLabel: 'Название', authorLabel: 'Автор', add: 'Добавить в каталог', added: 'Книга добавлена в каталог',
    footer: '© 2026 Библиотека. Все права защищены.'
  },
  en: {
    brand: 'Library', brandNote: 'Management system', reader: 'Ivan Petrov', admin: 'Librarian', ticket: 'Card #R10001',
    nav: { catalog: 'Catalogue', mybooks: 'My books', requests: 'My requests', admin: 'Management', books: 'Books' },
    catalogTitle: 'Book catalogue', searchPh: 'Find a book, author or genre…', find: 'Search', allGenres: 'All genres',
    available: 'Available', issued: 'On loan', reserved: 'Reserved', copies: 'copies', of: 'of', empty: 'Nothing found. Try another search.',
    back: 'Back to catalogue', year: 'Published', genre: 'Genre', author: 'Author', inStock: 'In stock', reserve: 'Reserve', reservedNote: 'Request sent to the librarian. Track it in “My requests”.',
    unavailable: 'All copies are currently on loan', alreadyRequested: 'You have already requested this book',
    mybooksTitle: 'My books', due: 'Return by', renew: 'Renew for 14 days', renewed: 'Renewed', overdue: 'Overdue', noBooks: 'You have no books on loan.', toCatalog: 'Open catalogue',
    requestsTitle: 'My requests', status: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }, noRequests: 'No requests yet.',
    adminTitle: 'Management', stats: ['Total books', 'On loan', 'Overdue', 'New requests'],
    newRequests: 'New requests', wants: 'wants to borrow', approve: 'Approve', reject: 'Reject', noPending: 'No new requests.',
    loansTitle: 'Books on loan', loansNote: 'Issue, return and renewal', accept: 'Accept return',
    booksTitle: 'Book stock', addTitle: 'Add a book', titleLabel: 'Title', authorLabel: 'Author', add: 'Add to catalogue', added: 'Book added to the catalogue',
    footer: '© 2026 Library. All rights reserved.'
  }
};

// Line icons instead of text symbols, matching the stroke style of the rest of the portfolio.
const icon = path => `<svg class="lb-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const icons = { back: icon('M15 18l-6-6 6-6'), ok: icon('M5 12.5l4.5 4.5L19 7.5'), no: icon('M6 6l12 12M18 6L6 18') };

const genres = {
  classic: ['Классика', 'Classics', '#2f7d4f'], dystopia: ['Антиутопия', 'Dystopia', '#b42a2a'], philosophy: ['Философия', 'Philosophy', '#7a5a2b'],
  fantasy: ['Фэнтези', 'Fantasy', '#2d5fa8'], scifi: ['Фантастика', 'Science fiction', '#c26a1b'], prose: ['Проза', 'Fiction', '#6d3fa8']
};

const seedBooks = [
  ['b1984', '1984', '1984', 'Джордж Оруэлл', 'George Orwell', 'dystopia', 1949, 2],
  ['alchemist', 'Алхимик', 'The Alchemist', 'Пауло Коэльо', 'Paulo Coelho', 'philosophy', 1988, 1],
  ['war', 'Война и мир', 'War and Peace', 'Лев Толстой', 'Leo Tolstoy', 'classic', 1869, 2],
  ['potter', 'Гарри Поттер и философский камень', 'Harry Potter and the Philosopher’s Stone', 'Дж. К. Роулинг', 'J. K. Rowling', 'fantasy', 1997, 1],
  ['dune', 'Дюна', 'Dune', 'Фрэнк Герберт', 'Frank Herbert', 'scifi', 1965, 1],
  ['master', 'Мастер и Маргарита', 'The Master and Margarita', 'Михаил Булгаков', 'Mikhail Bulgakov', 'classic', 1967, 1],
  ['comrades', 'Три товарища', 'Three Comrades', 'Эрих Мария Ремарк', 'Erich Maria Remarque', 'prose', 1936, 1],
  ['mockingbird', 'Убить пересмешника', 'To Kill a Mockingbird', 'Харпер Ли', 'Harper Lee', 'classic', 1960, 1]
];

const dayKey = offset => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export function createLibraryDemo({ lang }) {
  const t = copy[lang];
  const ru = lang === 'ru';
  const fmt = iso => new Date(`${iso}T12:00:00`).toLocaleDateString(ru ? 'ru-RU' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const genreName = id => genres[id]?.[ru ? 0 : 1] || id;
  let counter = 100;
  const nextId = () => `r${counter++}`;

  function initialState() {
    const people = ru ? ['Ольга Н.', 'Сергей К.', 'Артём Л.'] : ['Olga N.', 'Sergey K.', 'Artem L.'];
    const books = seedBooks.map(([id, titleRu, titleEn, authorRu, authorEn, genre, year, copies]) => ({ id, title: ru ? titleRu : titleEn, author: ru ? authorRu : authorEn, genre, year, copies }));
    return {
      query: '', genre: '', notice: '', form: { title: '', author: '', genre: 'classic' },
      books,
      loans: [
        { id: 'l1', bookId: 'b1984', reader: t.reader, due: dayKey(12), renewed: false, mine: true },
        { id: 'l2', bookId: 'alchemist', reader: people[0], due: dayKey(-2), renewed: true },
        { id: 'l3', bookId: 'dune', reader: people[1], due: dayKey(5), renewed: false },
        { id: 'l4', bookId: 'master', reader: people[0], due: dayKey(9), renewed: false },
        { id: 'l5', bookId: 'comrades', reader: people[2], due: dayKey(3), renewed: false }
      ],
      requests: [
        { id: 'q1', bookId: 'b1984', reader: t.reader, date: dayKey(-2), status: 'approved', mine: true },
        { id: 'q2', bookId: 'war', reader: people[1], date: dayKey(0), status: 'pending' },
        { id: 'q3', bookId: 'potter', reader: people[2], date: dayKey(0), status: 'pending' }
      ]
    };
  }

  const book = (s, id) => s.books.find(item => item.id === id);
  const onLoan = (s, id) => s.loans.filter(loan => loan.bookId === id).length;
  const held = (s, id) => s.requests.filter(request => request.bookId === id && request.status === 'pending').length;
  const free = (s, id) => book(s, id).copies - onLoan(s, id) - held(s, id);
  const statusOf = (s, id) => (free(s, id) > 0 ? 'available' : held(s, id) ? 'reserved' : 'issued');

  const cover = (item, size = '') => `<div class="lb-cover ${size}" style="--c:${genres[item.genre]?.[2] || '#555'}"><span>${escape(item.title)}</span><small>${escape(item.author)}</small></div>`;

  function header(route, role) {
    const tabs = role === 'admin' ? ['catalog', 'admin', 'books'] : ['catalog', 'mybooks', 'requests'];
    const name = role === 'admin' ? t.admin : t.reader;
    return `<header class="lb-header">
      <div class="lb-top"><button class="lb-brand" data-go="catalog" data-role="${role}"><b>${t.brand}</b><small>${t.brandNote}</small></button>
        <span class="lb-user"><i>${name.split(' ').map(part => part[0]).join('').slice(0, 2)}</i>${name}</span></div>
      <nav class="lb-tabs">${tabs.map(tab => `<button data-go="${tab}" data-role="${role}" ${route.name === tab ? 'aria-current="page"' : ''}>${t.nav[tab]}</button>`).join('')}</nav>
    </header>`;
  }

  const notice = s => (s.notice ? `<p class="lb-notice">${escape(s.notice)}</p>` : '');
  const footer = () => `<footer class="lb-footer">${t.footer}</footer>`;

  function catalog(s, route) {
    const query = s.query.trim().toLowerCase();
    const list = s.books.filter(item => (!s.genre || item.genre === s.genre) && (!query || `${item.title} ${item.author} ${genreName(item.genre)}`.toLowerCase().includes(query)));
    return `<section class="lb-page"><h1>${t.catalogTitle}</h1>
      <form class="lb-search"><input type="search" data-input="query" value="${escape(s.query)}" placeholder="${t.searchPh}"><button class="lb-btn">${t.find}</button></form>
      <div class="lb-chips"><button data-act="genre" data-genre="" ${!s.genre ? 'aria-pressed="true"' : ''}>${t.allGenres}</button>${Object.keys(genres).map(id => `<button data-act="genre" data-genre="${id}" ${s.genre === id ? 'aria-pressed="true"' : ''}>${genreName(id)}</button>`).join('')}</div>
      ${list.length ? `<div class="lb-grid">${list.map(item => {
        const status = statusOf(s, item.id);
        return `<button class="lb-book" data-go="book" data-id="${item.id}" data-role="${route.params.role || 'reader'}">${cover(item)}<b>${escape(item.title)}</b><small>${escape(item.author)}</small><em>${genreName(item.genre)}</em><span class="lb-badge ${status}">${t[status]}</span></button>`;
      }).join('')}</div>` : `<p class="lb-empty">${t.empty}</p>`}</section>`;
  }

  function bookPage(s, route) {
    const item = book(s, route.params.id) || s.books[0];
    const status = statusOf(s, item.id);
    const requested = s.requests.some(request => request.mine && request.bookId === item.id && request.status === 'pending');
    const isAdmin = route.params.role === 'admin';
    const action = isAdmin ? '' : requested
      ? `<p class="lb-muted">${t.alreadyRequested}</p>`
      : status === 'available' ? `<button class="lb-btn" data-act="reserve" data-id="${item.id}">${t.reserve}</button>` : `<p class="lb-muted">${t.unavailable}</p>`;
    return `<section class="lb-page"><button class="lb-back" data-go="catalog" data-role="${route.params.role || 'reader'}">${icons.back}${t.back}</button>${notice(s)}
      <div class="lb-detail">${cover(item, 'lb-cover-lg')}<div>
        <span class="lb-badge ${status}">${t[status]}</span><h1>${escape(item.title)}</h1><p class="lb-author">${escape(item.author)}</p>
        <dl><div><dt>${t.genre}</dt><dd>${genreName(item.genre)}</dd></div><div><dt>${t.year}</dt><dd>${item.year}</dd></div><div><dt>${t.inStock}</dt><dd>${Math.max(0, free(s, item.id))} ${t.of} ${item.copies} ${t.copies}</dd></div></dl>
        ${action}</div></div></section>`;
  }

  function mybooks(s) {
    const loans = s.loans.filter(loan => loan.mine);
    return `<section class="lb-page"><h1>${t.mybooksTitle}</h1>${notice(s)}
      ${loans.length ? `<div class="lb-list">${loans.map(loan => {
        const item = book(s, loan.bookId);
        const late = loan.due < dayKey(0);
        return `<article class="lb-row">${cover(item, 'lb-cover-sm')}<div><b>${escape(item.title)}</b><small>${escape(item.author)}</small></div>
          <span class="${late ? 'lb-late' : 'lb-muted'}">${late ? t.overdue : `${t.due} ${fmt(loan.due)}`}</span>
          ${loan.renewed ? `<span class="lb-badge reserved">${t.renewed}</span>` : `<button class="lb-btn lb-btn-line" data-act="renew" data-id="${loan.id}">${t.renew}</button>`}</article>`;
      }).join('')}</div>` : `<div class="lb-empty"><p>${t.noBooks}</p><button class="lb-btn" data-go="catalog" data-role="reader">${t.toCatalog}</button></div>`}</section>`;
  }

  function requests(s) {
    const mine = s.requests.filter(request => request.mine).slice().reverse();
    return `<section class="lb-page"><h1>${t.requestsTitle}</h1>
      ${mine.length ? `<div class="lb-list">${mine.map(request => {
        const item = book(s, request.bookId);
        return `<article class="lb-row">${cover(item, 'lb-cover-sm')}<div><b>${escape(item.title)}</b><small>${fmt(request.date)}</small></div><span></span><span class="lb-badge ${request.status}">${t.status[request.status]}</span></article>`;
      }).join('')}</div>` : `<p class="lb-empty">${t.noRequests}</p>`}</section>`;
  }

  function admin(s) {
    const pending = s.requests.filter(request => request.status === 'pending');
    const total = s.books.reduce((sum, item) => sum + item.copies, 0);
    const overdue = s.loans.filter(loan => loan.due < dayKey(0)).length;
    return `<section class="lb-page"><h1>${t.adminTitle}</h1>${notice(s)}
      <div class="lb-stats">${[total, s.loans.length, overdue, pending.length].map((value, i) => `<div class="${i === 2 && value ? 'is-alert' : ''}"><b>${value}</b><span>${t.stats[i]}</span></div>`).join('')}</div>
      <h2>${t.newRequests} (${pending.length})</h2>
      ${pending.length ? pending.map(request => `<article class="lb-request"><p><b>${escape(request.reader)}</b> ${t.wants} <b>«${escape(book(s, request.bookId).title)}»</b></p>
        <div><button class="lb-btn lb-btn-ok" data-act="approve" data-id="${request.id}">${icons.ok}${t.approve}</button><button class="lb-btn lb-btn-no" data-act="reject" data-id="${request.id}">${icons.no}${t.reject}</button></div></article>`).join('') : `<p class="lb-muted lb-box">${t.noPending}</p>`}
      <h2>${t.loansTitle}</h2><p class="lb-muted">${t.loansNote}</p>
      <div class="lb-list">${s.loans.map(loan => {
        const item = book(s, loan.bookId);
        const late = loan.due < dayKey(0);
        return `<article class="lb-row">${cover(item, 'lb-cover-sm')}<div><b>${escape(item.title)}</b><small>${escape(loan.reader)}</small></div>
          <span class="${late ? 'lb-late' : 'lb-muted'}">${late ? t.overdue : `${t.due} ${fmt(loan.due)}`}</span>
          <div class="lb-row-actions">${loan.renewed ? '' : `<button class="lb-btn lb-btn-line" data-act="renew" data-id="${loan.id}">${t.renew}</button>`}<button class="lb-btn lb-btn-line" data-act="return" data-id="${loan.id}">${t.accept}</button></div></article>`;
      }).join('')}</div></section>`;
  }

  function books(s) {
    return `<section class="lb-page"><h1>${t.booksTitle}</h1>${notice(s)}
      <form class="lb-form"><h2>${t.addTitle}</h2>
        <label><span>${t.titleLabel}</span><input data-input="form-title" value="${escape(s.form.title)}"></label>
        <label><span>${t.authorLabel}</span><input data-input="form-author" value="${escape(s.form.author)}"></label>
        <label><span>${t.genre}</span><select data-input="form-genre">${Object.keys(genres).map(id => `<option value="${id}" ${s.form.genre === id ? 'selected' : ''}>${genreName(id)}</option>`).join('')}</select></label>
        <button class="lb-btn" data-act="add-book" ${s.form.title.trim() && s.form.author.trim() ? '' : 'disabled'}>${t.add}</button></form>
      <div class="lb-list">${s.books.slice().reverse().map(item => `<article class="lb-row">${cover(item, 'lb-cover-sm')}<div><b>${escape(item.title)}</b><small>${escape(item.author)} · ${genreName(item.genre)}</small></div><span class="lb-muted">${Math.max(0, free(s, item.id))} / ${item.copies}</span><span class="lb-badge ${statusOf(s, item.id)}">${t[statusOf(s, item.id)]}</span></article>`).join('')}</div></section>`;
  }

  const screens = { catalog, book: bookPage, mybooks, requests, admin, books };
  const roleOf = route => (['admin', 'books'].includes(route.name) || route.params.role === 'admin' ? 'admin' : 'reader');

  return {
    host: 'library-system-rqke.freehosting.dev',
    start: { name: 'catalog', params: { role: 'reader' } },
    roles: [{ id: 'reader', label: ru ? 'Читатель' : 'Reader', route: ['catalog', { role: 'reader' }] }, { id: 'admin', label: ru ? 'Библиотекарь' : 'Librarian', route: ['admin', { role: 'admin' }] }],
    roleOf,
    screens: { catalog: ['catalog', { role: 'reader' }], booking: ['book', { id: 'war', role: 'reader' }], mybooks: ['mybooks', { role: 'reader' }], admin: ['admin', { role: 'admin' }] },
    initialState,
    path(route) {
      if (route.name === 'book') return `/book.php?id=${route.params.id}`;
      if (route.name === 'catalog') return '/';
      return `/${route.name === 'admin' ? 'admin' : route.name}.php`;
    },
    render(route, state) {
      const html = `<div class="lb">${header(route, roleOf(route))}${(screens[route.name] || catalog)(state, route)}${footer()}</div>`;
      state.notice = '';
      return html;
    },
    action(name, el, ctx) {
      const s = ctx.state;
      const id = el.dataset.id;
      if (name === 'genre') s.genre = el.dataset.genre;
      if (name === 'reserve' && free(s, id) > 0) {
        s.requests.push({ id: nextId(), bookId: id, reader: t.reader, date: dayKey(0), status: 'pending', mine: true });
        s.notice = t.reservedNote;
      }
      if (name === 'approve' || name === 'reject') {
        const request = s.requests.find(item => item.id === id);
        if (request) {
          request.status = name === 'approve' ? 'approved' : 'rejected';
          if (name === 'approve') s.loans.unshift({ id: nextId(), bookId: request.bookId, reader: request.reader, due: dayKey(14), renewed: false, mine: !!request.mine });
        }
      }
      if (name === 'renew') { const loan = s.loans.find(item => item.id === id); if (loan) { loan.due = dayKey(Math.max(0, Math.round((new Date(`${loan.due}T12:00:00`) - new Date(`${dayKey(0)}T12:00:00`)) / 864e5)) + 14); loan.renewed = true; } }
      if (name === 'return') s.loans = s.loans.filter(item => item.id !== id);
      if (name === 'add-book') {
        s.books.push({ id: nextId(), title: s.form.title.trim(), author: s.form.author.trim(), genre: s.form.genre, year: new Date().getFullYear(), copies: 1 });
        s.form = { title: '', author: '', genre: s.form.genre };
        s.notice = t.added;
      }
      ctx.rerender();
    },
    input(name, el, ctx) {
      const s = ctx.state;
      if (name === 'query') { s.query = el.value; ctx.rerender(); return; }
      if (name.startsWith('form-')) {
        s.form[name.slice(5)] = el.value;
        ctx.rerender();
      }
    }
  };
}
