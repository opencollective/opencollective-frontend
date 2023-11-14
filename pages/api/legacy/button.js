import fs from 'fs';
import path from 'path';

import { template } from 'lodash';

export default function handler(req, res) {
  const content = fs.readFileSync(path.join(process.cwd(), 'server/templates/button.js'), 'utf8');
  const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });
  res.set('Cache-Control', `public, max-age=86400`);
  res.setHeader('content-type', 'application/javascript');
  res.removeHeader('X-Frame-Options');
  res.send(
    compiled({
      collectiveSlug: req.query.collectiveSlug,
      verb: req.query.verb,
      host: process.env.WEBSITE_URL,
    }),
  );
}
