import { pick } from 'lodash-es';
import type { NextApiRequest, NextApiResponse } from 'next';

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const graphqlUrl = `${process.env.API_URL}/graphql/v1?api_key=${process.env.API_KEY}`;

  const result = await fetch(graphqlUrl, {
    method: req.method,
    // `pick` widens the header values to `string | string[] | undefined`; `fetch` accepts them as-is.
    headers: pick(req.headers, [
      'accept',
      'content-type',
      'authorization',
      'user-agent',
      'accept-language',
      'x-two-factor-authentication',
    ]) as HeadersInit,
    body: JSON.stringify(req.body),
  });

  const json = await result.json();

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
