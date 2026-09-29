# rqke / SYSTEMS — HTML, CSS, JS + Vite

Портфолио без React, Next.js и серверного фреймворка. Сам сайт написан на обычных HTML, CSS и Vanilla JavaScript, а Vite используется только как dev-server и production-сборщик.

## Что сохранено

- intro-анимация;
- sticky/parallax hero;
- reveal-анимации при прокрутке;
- фиксированная боковая навигация;
- mobile menu;
- RU/EN переключение;
- вертикальный скролл, управляющий горизонтальной лентой кейсов;
- journey dialog;
- services / manifesto / proof slider / FAQ;
- архив проектов и фильтры;
- отдельные страницы кейсов;
- lightbox галереи;
- scroll progress;
- адаптивная вёрстка;
- полностью статическая форма проекта.

## Стек

- HTML5
- CSS3
- Vanilla JavaScript / ES Modules
- Vite 8

React, Next.js, TypeScript и backend для запуска сайта не нужны.

## Последний дизайн-проход

В этой версии также пересобраны сетка и типографическая иерархия: увеличен важный мелкий текст и интерактивные зоны, социальные ссылки вынесены в верхнюю навигацию, усилен первый экран, этапы подхода получили последовательную ось, секция проектов больше не конкурирует заголовком с карточками, а на страницах кейсов кнопка возврата остаётся доступной при прокрутке. Для русской версии однобуквенные предлоги и союзы автоматически связываются со следующим словом неразрывным пробелом.

## Установка

Нужен Node.js версии, совместимой с Vite 8. На момент настройки проекта Vite рекомендует Node.js 20.19+ или 22.12+.

```bash
npm install
```

## Команды

### Development

```bash
npm run dev
```

Vite запустит локальный dev-server, обычно на:

```text
http://localhost:5173/
```

### Production build

```bash
npm run build
```

Готовая production-версия появится в:

```text
dist/
```

Собираются не только главная, но и:

```text
/projects/
/projects/beauty-booking/
/projects/library-system/
/404.html
```

### Preview production build

Сначала:

```bash
npm run build
```

затем:

```bash
npm run preview
```

Обычно preview будет доступен на:

```text
http://localhost:4173/
```

## Структура

```text
index.html
404.html
.nojekyll
package.json
vite.config.js
.gitignore
assets/
  css/
    global.css
    home.css
  js/
    core.js
    data.js
    home.js
    projects.js
    project.js
  images/
projects/
  index.html
  beauty-booking/index.html
  library-system/index.html
```

`assets/js/data.js` — единый источник данных проектов и ссылок.

`assets/js/core.js` — общая логика сайта: навигация, язык, header/footer, scroll progress и вспомогательные функции.

`home.js`, `projects.js` и `project.js` — отдельные entry-модули страниц.

## GitHub Pages

Vite настроен с относительным `base: './'`, поэтому production build подходит и для корневого GitHub Pages-домена, и для адреса вида:

```text
username.github.io/repository/
```

Для публикации production-сборки:

```bash
npm install
npm run build
```

После этого публикуйте содержимое `dist/`.

`.nojekyll` автоматически попадает в production build.

## Статический режим формы

GitHub Pages не выполняет backend-код, поэтому форма не отправляет POST на `/api/contact`. Она работает полностью в браузере: валидирует данные, формирует бриф и позволяет передать его через доступные клиентские действия.


### Последние правки интерфейса

- FAQ собран в две независимые вертикальные колонки: раскрытие ответа не растягивает соседнюю карточку.
- В анкете добавлен тип «Своё», а ограничение длины описания снято.
- Hero-блок уменьшен и отделён от фонового wordmark `rqke`; подсказка «Листайте дальше» удалена.
