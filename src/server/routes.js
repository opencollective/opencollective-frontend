import path from 'path';
import nextRoutes from 'next-routes';
import _ from 'lodash';
import fs from 'fs';

const pages = nextRoutes();

pages.add('event', '/:collectiveSlug/events/:eventSlug');
pages.add('button', '/:collectiveSlug/donate/button');

module.exports = (server) => {

  server.get('/:collectiveSlug/donate/button.png', (req, res) => {
    const color = (req.query.color === 'blue') ? 'blue' : 'white';
    res.sendFile(path.join(__dirname, `../static/images/buttons/donate-button-${color}.png`));
  });

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