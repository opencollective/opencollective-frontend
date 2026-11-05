import { URL } from 'url';

import type { NextApiRequest, NextApiResponse } from 'next';

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = new URL(`${process.env.API_URL}/users/exists?api_key=${process.env.API_KEY}`);
  apiUrl.searchParams.set('email', String(req.query.email));

  const json = await fetch(apiUrl).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
