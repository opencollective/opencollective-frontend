import { pick } from 'lodash-es';
import type { NextApiRequest, NextApiResponse } from 'next';

const FORWARDED_HEADERS = ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language'] as const;

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = `${process.env.API_URL}/users/refresh-token?api_key=${process.env.API_KEY}`;

  const result = await fetch(apiUrl, {
    method: req.method,
    headers: pick(req.headers, [...FORWARDED_HEADERS]),
    body: JSON.stringify(req.body),
  });

  const json = await result.json();

  res.setHeader('Content-Type', 'application/json');
  res.status(result.status).json(json);
}
