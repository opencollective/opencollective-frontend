import url from 'url';
import path from 'path';
import { template } from 'lodash';
import fs from 'fs';
import pdf from 'html-pdf';
import moment from 'moment';
import express from 'express';
import proxy from 'express-http-proxy';

import pages from './pages';
import controllers from './controllers';
import { maxAge } from './middlewares';
import { logger } from './logger';
import { getBaseApiUrl } from '../lib/utils';
import email from './lib/email';

export default (server, app) => {
  const urlencodedParser = express.urlencoded({ extended: false });

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

  server.get('/static/*', maxAge(7200));

  server.get('/favicon.*', maxAge(300000), (req, res) => {
    return res.sendFile(path.join(__dirname, '../static/images/favicon.ico.png'));
  });

  // NOTE: in production and staging environment, this is currently not used
  // we use Cloudflare workers to route the request directly to the API
  server.use(
    '/api',
    proxy(getBaseApiUrl({ internal: true }), {
      parseReqBody: false,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['oc-frontend-api-proxy'] = '1';
        proxyReqOpts.headers['oc-frontend-ip'] = srcReq.ip;
        proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip;
        return proxyReqOpts;
      },
      proxyReqPathResolver: req => {
        const [pathname, search] = req.url.split('?');
        const searchParams = new url.URLSearchParams(search);
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

  /**
   * For backward compatibility.
   * Ideally we should consolidate those routes under:
   * `/:collectiveSlug/members/:backerType(all|users|organizations)`
   */

  server.get('/:collectiveSlug.:format(json)', controllers.collectives.info);
  server.get('/:collectiveSlug/members.:format(json|csv)', controllers.members.list);
  server.get(
    '/:collectiveSlug/members/:backerType(all|users|organizations).:format(json|csv)',
    controllers.members.list,
  );
  server.get(
    '/:collectiveSlug/tiers/:tierSlug/:backerType(all|users|organizations).:format(json|csv)',
    controllers.members.list,
  );

  server.get('/:collectiveSlug/:verb(contribute|donate)/button:size(|@2x).png', (req, res) => {
    const color = req.query.color === 'blue' ? 'blue' : 'white';
    res.sendFile(
      path.join(__dirname, `../static/images/buttons/${req.params.verb}-button-${color}${req.params.size}.png`),
    );
  });

  server.get('/:collectiveSlug/events.:format(json)', controllers.events.list);
  server.get('/:collectiveSlug/events/:eventSlug.:format(json)', controllers.events.info);
  server.get(
    '/:collectiveSlug/events/:eventSlug/:role(attendees|followers|organizers|all).:format(json|csv)',
    controllers.members.list,
  );
  server.get('/:collectiveSlug/events/:eventSlug/nametags.:format(pdf|html)', (req, res, next) => {
    const { collectiveSlug, eventSlug, pageFormat, format } = req.params;
    const params = { ...req.params, ...req.query };
    app.renderToHTML(req, res, '/nametags', params).then(html => {
      if (format === 'html') {
        return res.send(html);
      }

      const options = {
        pageFormat: pageFormat === 'A4' ? 'A4' : 'Letter',
        renderDelay: 3000,
      };
      // html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'');
      const filename = `${moment().format('YYYYMMDD')}-${collectiveSlug}-${eventSlug}-attendees.pdf`;

      res.setHeader('content-type', 'application/pdf');
      res.setHeader('content-disposition', `inline; filename="${filename}"`); // or attachment?
      pdf.create(html, options).toStream((err, stream) => {
        if (err) {
          logger.error('>>> Error while generating pdf at %s', req.url, err);
          return next(err);
        }
        stream.pipe(res);
      });
    });
  });

  server.get('/:collectiveSlug/:verb(contribute|donate)/button.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, '../templates/button.js'), 'utf8');
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
    const content = fs.readFileSync(path.join(__dirname, '../templates/widget.js'), 'utf8');
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

  // Form submission in Marketing pages

  server.post('/:pageSlug(gift-of-giving|gift-cards)', urlencodedParser, (req, res, next) => {
    email.sendMessage({
      to: 'Open Collective <info@opencollective.com>',
      from: 'Open Collective <info@opencollective.com>',
      subject: 'Gift of Giving',
      text: JSON.stringify(req.body, null, 2),
    });
    next();
  });

  return pages.getRequestHandler(server.next);
};
