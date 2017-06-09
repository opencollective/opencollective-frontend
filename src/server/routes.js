import path from 'path';
import nextRoutes from 'next-routes';
import _ from 'lodash';
import fs from 'fs';
import pdf from 'html-pdf';
import moment from 'moment';

const pages = nextRoutes();

pages.add('event', '/:collectiveSlug/events/:eventSlug');
pages.add('nametags', '/:collectiveSlug/events/:eventSlug/nametags');
pages.add('button', '/:collectiveSlug/donate/button');

module.exports = (server, app) => {

  server.get('/:collectiveSlug/donate/button:size(|@2x).png', (req, res) => {
    const color = (req.query.color === 'blue') ? 'blue' : 'white';
    res.sendFile(path.join(__dirname, `../static/images/buttons/donate-button-${color}${req.params.size}.png`));
  });

  server.get('/:collectiveSlug/events/:eventSlug/nametags.pdf', (req, res) => {
    const { collectiveSlug, eventSlug, format } = req.params;
    app.renderToHTML(req, res, 'nametags', req.params)
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
          stream.pipe(res);
        });
      });
  })

  server.get('/:collectiveSlug/donate/button.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname,'../templates/widget.js'), 'utf8');
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(content);
    res.setHeader('content-type', 'application/javascript');
    res.send(compiled({
      collectiveSlug: req.params.collectiveSlug,
      host: process.env.WEBSITE_URL || "http://localhost:3000"
    }))
  });

  return pages.getRequestHandler(server.next);

}