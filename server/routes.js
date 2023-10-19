const fs = require('fs');
const path = require('path');

const express = require('express');
const proxy = require('express-http-proxy');
const { template, trim } = require('lodash');

const downloadFileHandler = require('./download-file');
const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;

const maxAge = (maxAge = 60) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

module.exports = (expressApp, nextApp) => {
  const app = expressApp;

  // Support older assets from website
  app.use('/public/images', express.static(path.join(__dirname, '../public/static/images')));

  app.get('/static/*', maxAge(86400));

  app.get('/favicon.*', maxAge(300000), (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/static/images/favicon.ico.png'));
  });

  /* Helper to enable downloading files that are on S3 since Chrome and Firefox does
   not allow cross-origin downloads when using the download attribute on an anchor tag,
   see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download. */
  app.get('/api/download-file', downloadFileHandler);

  // NOTE: in production and staging environment, this is currently not used
  // we use Cloudflare workers to route the request directly to the API
  if (process.env.API_PROXY === 'true') {
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
  }

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
      const path = req.path.split('/'); // `/-xxx-/test` => [ '', '-xxx-', 'test' ]
      const slug = path[1]; // slug = '-xxx-'
      const trimmedSlug = trim(slug, '-'); // '-xxx-' => 'xxx'
      if (trimmedSlug && trimmedSlug !== slug) {
        path[1] = trimmedSlug; // path = [ '', 'xxx', 'test' ]
        return res.redirect(301, path.join('/')); // `/xxx/test`
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

  return nextApp.getRequestHandler();
};
