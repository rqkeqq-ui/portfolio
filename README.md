# rqke / SYSTEMS

Personal portfolio built with plain HTML, CSS and Vanilla JavaScript. Vite is used only for local development and the production build.

**Live site:** https://rqkeqq-ui.github.io/portfolio/

## Stack

- HTML5
- CSS3
- Vanilla JavaScript / ES Modules
- Vite 8
- GitHub Actions
- GitHub Pages

No React, Next.js or backend is required to run the portfolio.

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The compiled site is written to `dist/`.

## Structure

```text
index.html
404.html
assets/
  css/
  js/
  images/
projects/
  index.html
  beauty-booking/
  library-system/
vite.config.js
```

Project content and links live in `assets/js/data.js`. Shared UI and navigation logic lives in `assets/js/core.js`.

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`:

1. installs dependencies;
2. builds the Vite project;
3. verifies the required production pages and assets;
4. publishes `dist/` to GitHub Pages.

The Vite build uses relative paths so the site works under the repository subpath `/portfolio/`.

## Notes

The contact form is fully client-side because GitHub Pages does not run server code. External project, GitHub and Telegram links remain normal outbound links.
