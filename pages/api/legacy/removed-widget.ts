import type { NextApiRequest } from 'next';

// `res` is the Express response object provided by the custom server (`server/index.ts`); express has
// no types in this project, so it stays untyped until the server layer is migrated.

// The "collectives" widget (`/:collectiveSlug/collectives.html` and `/:collectiveSlug/widget.html`) has been
// removed (https://github.com/opencollective/opencollective/issues/9122). Pages may still embed it in an iframe:
// answer with an empty, transparent page rather than our 404 page, which would show up inside their layout.
// 410 tells crawlers the page is gone for good.
const EMPTY_PAGE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Open Collective</title>
    <style>
      html,
      body {
        margin: 0;
        background: transparent;
      }
    </style>
  </head>
  <body></body>
</html>
`;

// next.js export
// ts-unused-exports:disable-next-line
export default function handler(req: NextApiRequest, res) {
  res.status(410);
  res.set('Cache-Control', `public, max-age=86400`);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.send(EMPTY_PAGE);
}
