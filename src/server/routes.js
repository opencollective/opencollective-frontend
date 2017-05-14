import path from 'path';
import nextRoutes from 'next-routes';
import { template } from 'lodash';
import fs from 'fs';

const pages = nextRoutes();

pages.add('event', '/:collectiveSlug/events/:eventSlug');
pages.add('button', '/:collectiveSlug/donate/button');

module.exports = (server) => {

  server.get('/:collectiveSlug/donate/button.js', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname,'../templates/widget.js'), 'utf8');
    const compiled = template(content);
    res.setHeader('content-type', 'application/javascript');
    res.send(compiled({
      collectiveSlug: req.params.collectiveSlug,
      host: 'http://localhost:3000'
    }))
  });

  return pages.getRequestHandler(server.next);

}