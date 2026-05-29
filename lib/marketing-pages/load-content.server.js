const fs = require('fs');
const path = require('path');

const languages = require('../constants/locales');
const localeKeys = languages.default ? Object.keys(languages.default) : Object.keys(languages);

const PAGES = {
  'gift-of-giving': {
    basePath: 'holiday-gift-card',
    cssPath: 'holiday-gift-card/stylesheets/style.css',
  },
  'gift-cards': {
    basePath: 'gift-cards-page',
    cssPath: 'gift-cards-page/stylesheets/style.css',
    className: 'mkt-page-how-it-works',
  },
};

const readPublicFile = relativePath => {
  return fs.readFileSync(path.join(process.cwd(), 'public', relativePath), 'utf-8');
};

const resolveHtmlPath = (page, locale) => {
  if (locale !== 'en' && localeKeys.includes(locale)) {
    return `${page.basePath}/index.${locale}.html`;
  }
  return `${page.basePath}/index.html`;
};

/** Loads marketing page HTML and CSS from the public folder (server-side). */
function loadMarketingPageContent(pageSlug, locale) {
  const page = PAGES[pageSlug];
  if (!page) {
    return null;
  }

  const htmlPath = resolveHtmlPath(page, locale);
  const cssPath = page.cssPath;

  let html;
  try {
    html = readPublicFile(htmlPath);
  } catch {
    html = readPublicFile(`${page.basePath}/index.html`);
  }

  return {
    html,
    css: readPublicFile(cssPath),
    className: page.className,
  };
}

module.exports = { loadMarketingPageContent };
