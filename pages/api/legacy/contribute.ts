import path from 'path';

import type { NextApiRequest } from 'next';

// `res` is the Express response object provided by the custom server (`server/index.ts`); express has
// no types in this project, so it stays untyped until the server layer is migrated.

// next.js export
// ts-unused-exports:disable-next-line
export default function handler(req: NextApiRequest, res) {
  const color = req.query.color === 'blue' ? 'blue' : 'white';
  const verb = ['donate', 'contribute'].includes(String(req.query.verb)) ? String(req.query.verb) : 'contribute';
  const size = req.query.size === '@2x' ? req.query.size : '';
  res.set('Cache-Control', `public, max-age=86400`);
  res.sendFile(path.join(process.cwd(), `public/static/images/buttons/${verb}-button-${color}${size}.png`));
}
