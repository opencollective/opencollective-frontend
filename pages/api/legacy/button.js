import fs from 'fs';
import path from 'path';

import { template } from 'lodash-es';

const COLLECTIVE_SLUG_REGEX = /^[a-z0-9-]{1,128}$/i;
const VERB_ALLOWLIST = /^(contribute|donate)$/;

// next.js export
// ts-unused-exports:disable-next-line
export default function handler(req, res) {
  const content = fs.readFileSync(path.join(process.cwd(), 'server/templates/button.js'), 'utf8');
  const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });

  const collectiveSlug =
    typeof req.query?.collectiveSlug === 'string' && COLLECTIVE_SLUG_REGEX.test(req.query.collectiveSlug)
      ? req.query.collectiveSlug
      : 'collective';
  const verb = typeof req.query?.verb === 'string' && VERB_ALLOWLIST.test(req.query.verb) ? req.query.verb : 'donate';

  res.set('Cache-Control', `public, max-age=86400`);
  res.setHeader('content-type', 'application/javascript');
  res.removeHeader('X-Frame-Options');
  res.send(
    compiled({
      collectiveSlug,
      verb,
      host: process.env.WEBSITE_URL,
    }),
  );
}
