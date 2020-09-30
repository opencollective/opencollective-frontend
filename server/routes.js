const fs = require('fs');
const path = require('path');

const express = require('express');
const proxy = require('express-http-proxy');
const { template, trim } = require('lodash');

const intl = require('./intl');
const pages = require('./pages');

const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;

const maxAge = (maxAge = 60) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

module.exports = (expressApp, nextApp) => {
  const app = expressApp;

  app.use((req, res, next) => {
    if (!req.language && req.locale !== 'en') {
      // Prevent server side caching of non english content
      res.set('Cache-Control', 'no-store, no-cache, max-age=0');
    } else {
      // When using Cloudflare, there might be a default cache
      // We're setting that for all requests to reduce the default to 1 minute
      res.set('Cache-Control', 'public, max-age=60');
    }
    next();
  });

  app.use('/_next/static', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  });

  app.use((req, res, next) => {
    if (req.query.language && intl.supportedLanguages.includes(req.query.language) && req.query.set) {
      res.cookie('language', req.language);
      const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
      url.searchParams.delete('language');
      url.searchParams.delete('set');
      res.redirect(`${url.pathname}${url.search}`);
      return;
    }
    next();
  });

  // Support older assets from website
  app.use('/public/images', express.static(path.join(__dirname, '../public/static/images')));

  app.get('/static/*', maxAge(86400));

  app.get('/favicon.*', maxAge(300000), (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/static/images/favicon.ico.png'));
  });

  // NOTE: in production and staging environment, this is currently not used
  // we use Cloudflare workers to route the request directly to the API
  app.use(
    '/api',
    proxy(baseApiUrl, {
      parseReqBody: false,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        for (const key of ['oc-env', 'oc-secret', 'oc-application']) {
          if (srcReq.headers[key]) {
            proxyReqOpts.headers[key] = srcReq.headers[key];
          }
        }
        proxyReqOpts.headers['oc-frontend-api-proxy'] = '1';
        proxyReqOpts.headers['oc-frontend-ip'] = srcReq.ip;
        proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip;
        return proxyReqOpts;
      },
      proxyReqPathResolver: req => {
        const [pathname, search] = req.url.split('?');
        const searchParams = new URLSearchParams(search);
        searchParams.set('api_key', process.env.API_KEY);
        return `${pathname.replace(/api/, '/')}?${searchParams.toString()}`;
      },
    }),
  );

  /**
   * Prevent indexation from search engines
   * (out of 'production' environment)
   */
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    if (process.env.OC_ENV !== 'production' || process.env.ROBOTS_DISALLOW) {
      res.send('User-agent: *\nDisallow: /');
    } else {
      res.send('User-agent: *\nAllow: /');
    }
  });

  // This is used by Cypress to collect server side coverage
  if (process.env.OC_ENV === 'e2e' || process.env.E2E_TEST) {
    app.get('/__coverage__', (req, res) => {
      res.json({
        coverage: global.__coverage__ || null,
      });
      global.__coverage__ = {};
    });
  }

  // Correct slug links that end or start with hyphen
  app.use((req, res, next) => {
    if (req.path) {
      const path = req.path.split('/');
      const slug = path[1];
      if (trim(slug, '-') != slug) {
        path[1] = trim(slug, '-');
        return res.redirect(301, path.join('/'));
      }
    }
    next();
  });

  app.get('/:collectiveSlug/:verb(contribute|donate)/button:size(|@2x).png', maxAge(86400), (req, res) => {
    const color = req.query.color === 'blue' ? 'blue' : 'white';
    res.sendFile(
      path.join(__dirname, `../public/static/images/buttons/${req.params.verb}-button-${color}${req.params.size}.png`),
    );
  });

  app.get('/:collectiveSlug/:verb(contribute|donate)/button.js', maxAge(86400), (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, './templates/button.js'), 'utf8');
    const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });
    res.setHeader('content-type', 'application/javascript');
    res.removeHeader('X-Frame-Options');
    res.send(
      compiled({
        collectiveSlug: req.params.collectiveSlug,
        verb: req.params.verb,
        host: process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 3000}`,
      }),
    );
  });

  app.get('/:collectiveSlug/:widget(widget|events|collectives|banner).js', maxAge(86400), (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, './templates/widget.js'), 'utf8');
    const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });
    res.setHeader('content-type', 'application/javascript');
    res.send(
      compiled({
        style: '{}',
        ...req.query,
        collectiveSlug: req.params.collectiveSlug,
        widget: req.params.widget,
        host: process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 3000}`,
      }),
    );
  });

  return pages.getRequestHandler(nextApp);
};
