const fs = require('fs');
const path = require('path');
const url = require('url');

const express = require('express');
const proxy = require('express-http-proxy');
const { template } = require('lodash');

const intl = require('./intl');
const pages = require('./pages');

const { URL, URLSearchParams } = url;
const baseApiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;

const maxAge = (maxAge = 60) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

module.exports = (server, app) => {
  server.use((req, res, next) => {
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

  server.use('/_next/static', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  });

  server.use((req, res, next) => {
    if (req.query.language && intl.languages.includes(req.query.language) && req.query.set) {
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
  server.use('/public/images', express.static(path.join(__dirname, '../static/images')));
  server.use('/.well-known', express.static(path.join(__dirname, '../static/.well-known')));

  server.get('/static/*', maxAge(7200));

  // Security policy, following the standard from https://securitytxt.org/

  server.get('/favicon.*', maxAge(300000), (req, res) => {
    return res.sendFile(path.join(__dirname, '../static/images/favicon.ico.png'));
  });

  // NOTE: in production and staging environment, this is currently not used
  // we use Cloudflare workers to route the request directly to the API
  server.use(
    '/api',
    proxy(baseApiUrl, {
      parseReqBody: false,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
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
  server.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    if (process.env.NODE_ENV !== 'production' || process.env.ROBOTS_DISALLOW) {
      res.send('User-agent: *\nDisallow: /');
    } else {
      res.send('User-agent: *\nAllow: /');
    }
  });

  server.get('/:collectiveSlug/:verb(contribute|donate)/button:size(|@2x).png', (req, res) => {
    const color = req.query.color === 'blue' ? 'blue' : 'white';
    res.sendFile(
      path.join(__dirname, `../static/images/buttons/${req.params.verb}-button-${color}${req.params.size}.png`),
    );
  });

  server.get('/:collectiveSlug/:verb(contribute|donate)/button.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, './templates/button.js'), 'utf8');
    const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });
    res.setHeader('content-type', 'application/javascript');
    res.send(
      compiled({
        collectiveSlug: req.params.collectiveSlug,
        verb: req.params.verb,
        host: process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 3000}`,
      }),
    );
  });

  server.get('/:collectiveSlug/:widget(widget|events|collectives|banner).js', (req, res) => {
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

  return pages.getRequestHandler(app);
};
