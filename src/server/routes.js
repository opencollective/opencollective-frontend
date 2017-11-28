import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import pdf from 'html-pdf';
import moment from 'moment';
import pages from './pages';
import { translateApiUrl } from '../lib/utils';
import { getCloudinaryUrl } from './lib/utils';
import request from 'request';
import controllers from './controllers';
import * as mw from './middlewares';
import express from 'express';

module.exports = (server, app) => {

  server.get('*', mw.ga, (req, res, next) => {
    // By default, we cache all GET calls for 30s at the CDN level (cloudflare) => we should increase this over time
    // note: only for production/staging (NextJS overrides this in development env)
    res.setHeader('cache-control', 'max-age=30');
    return next();
  });

  server.get('/favicon.*', (req, res) => res.send(404));

  server.all('/api/*', (req, res) => {
    console.log(">>> api request", translateApiUrl(req.url));
    req
      .pipe(request(translateApiUrl(req.url), { followRedirect: false }))
      .on('error', (e) => {
        console.error("error calling api", translateApiUrl(req.url), e);
        res.status(500).send(e);
      })
      .pipe(res);
  });

  /**
   * Proxy all images so that we can serve them from the opencollective.com domain
   * and we can cache them at cloudflare level (to reduce bandwidth at cloudinary level)
   * Format: /proxy/images?src=:encoded_url&width=:width
   */
  server.get('/proxy/images', (req, res) => {
    const { src, width, height, query } = req.query;

    const url = getCloudinaryUrl(src, { width, height, query });

    req
      .pipe(request(url, { followRedirect: false }))
      .on('error', (e) => {
        console.error("error proxying ", url, e);
        res.status(500).send(e);
      })
      .pipe(res);
  });

  
  /**
   * For backward compatibility.
   * Ideally we should consolidate those routes under:
   * `/:collectiveSlug/members/:backerType(all|users|organizations)`
   */
  server.use('/public', express.static(path.join(__dirname, `../public`), { maxAge: '1d' }));  

  server.get('/:collectiveSlug/:backerType.svg', controllers.collectives.banner);
  server.get('/:collectiveSlug/:backerType/badge.svg', controllers.collectives.badge);
  server.get('/:collectiveSlug/:backerType/:position/avatar(.:format(png|jpg|svg))?', mw.maxAge(300), mw.ga, controllers.collectives.avatar);
  server.get('/:collectiveSlug/:backerType/:position/website(.:format(png|jpg|svg))?', mw.ga, controllers.collectives.website);

  server.get('/:collectiveSlug/tiers/:tierSlug.:format(png|jpg|svg)', controllers.collectives.banner);
  server.get('/:collectiveSlug/members.:format(json|csv)', controllers.members.list);
  server.get('/:collectiveSlug/members/:backerType(all|users|organizations).:format(json|csv)', controllers.members.list);
  server.get('/:collectiveSlug/tiers/:tierSlug/:backerType(all|users|organizations).:format(json|csv)', controllers.members.list);
  server.get('/:collectiveSlug/tiers/:tierSlug/badge.svg', controllers.collectives.badge);
  server.get('/:collectiveSlug/tiers/:tierSlug/:position/avatar(.:format(png|jpg|svg))?', mw.maxAge(300), mw.ga, controllers.collectives.avatar);
  server.get('/:collectiveSlug/tiers/:tierSlug/:position/website(.:format(png|jpg|svg))?', mw.ga, controllers.collectives.website);

  server.get('/:collectiveSlug/:verb(contribute|donate)/button:size(|@2x).png', (req, res) => {
    const color = (req.query.color === 'blue') ? 'blue' : 'white';
    res.sendFile(path.join(__dirname, `../static/images/buttons/${req.params.verb}-button-${color}${req.params.size}.png`));
  });

  server.get('/:collectiveSlug/events/:eventSlug/nametags.pdf', (req, res, next) => {
    const { collectiveSlug, eventSlug, format } = req.params;
    const params = {...req.params, ...req.query};
    app.renderToHTML(req, res, 'nametags', params)
      .then((html) => {
        const options = {
          format: (format === 'A4') ? 'A4' : 'Letter',
          renderDelay: 3000
        };
        // html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'');
        const filename = `${moment().format('YYYYMMDD')}-${collectiveSlug}-${eventSlug}-attendees.pdf`;

        res.setHeader('content-type','application/pdf');
        res.setHeader('content-disposition', `inline; filename="${filename}"`); // or attachment?
        pdf.create(html, options).toStream((err, stream) => {
          if (err) {
            console.log(">>> error while generating pdf", req.url, err);
            return next(err);
          }
          stream.pipe(res);
        });
      });
  })

  server.get('/:collectiveSlug/:verb(contribute|donate)/button.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname,'../templates/button.js'), 'utf8');
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(content);
    res.setHeader('content-type', 'application/javascript');
    res.send(compiled({
      collectiveSlug: req.params.collectiveSlug,
      verb: req.params.verb,
      host: process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 3000}`
    }))
  });

  server.get('/:collectiveSlug/events.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname,'../templates/events.js'), 'utf8');
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(content);
    res.setHeader('content-type', 'application/javascript');
    res.send(compiled({
      collectiveSlug: req.params.collectiveSlug,
      id: req.query.id,
      host: process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 3000}`
    }))
  });

  return pages.getRequestHandler(server.next);

}
