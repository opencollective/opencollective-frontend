import { URL } from 'url';

import { pick } from 'lodash-es';
import type { NextApiRequest, NextApiResponse } from 'next';

const FORWARDED_HEADERS = ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language'] as const;

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = new URL(`${process.env.API_URL}/github-repositories?api_key=${process.env.API_KEY}`);

  const result = await fetch(apiUrl, {
    method: 'GET',
    headers: pick(req.headers, [...FORWARDED_HEADERS]),
  });

  const json = await result.json();

  res.setHeader('Content-Type', 'application/json');
  res.status(result.status).json(json);
}
