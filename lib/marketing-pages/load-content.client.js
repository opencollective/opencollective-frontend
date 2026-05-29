import languages from '../constants/locales';

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

const resolveHtmlPath = (page, locale) => {
  if (locale !== 'en' && languages[locale]) {
    return `${page.basePath}/index.${locale}.html`;
  }
  return `${page.basePath}/index.html`;
};

const fetchPublicFile = async relativePath => {
  const response = await fetch(`/${relativePath}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch /${relativePath}: ${response.status}`);
  }
  return response.text();
};

/** Loads marketing page HTML and CSS from the public folder (client-side). */
export async function loadMarketingPageContent(pageSlug, locale) {
  const page = PAGES[pageSlug];
  if (!page) {
    return null;
  }

  const htmlPath = resolveHtmlPath(page, locale);
  const cssPath = page.cssPath;

  let html;
  try {
    html = await fetchPublicFile(htmlPath);
  } catch {
    html = await fetchPublicFile(`${page.basePath}/index.html`);
  }

  return {
    html,
    css: await fetchPublicFile(cssPath),
    className: page.className,
  };
}
