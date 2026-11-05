import { URL } from 'url';

import { pick } from 'lodash-es';
import type { NextApiRequest, NextApiResponse } from 'next';

import { oauthServiceAllowlist } from '@/lib/constants/oauth';

const FORWARDED_HEADERS = ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language'] as const;

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { service } = req.query;
  if (!oauthServiceAllowlist.has(String(service))) {
    return res.status(404).send({ code: 404, message: 'Service not supported' });
  }

  const apiUrl = new URL(`${process.env.API_URL}/connected-accounts/${service}/callback`);
  apiUrl.searchParams.set('api_key', String(process.env.API_KEY));
  apiUrl.searchParams.set('code', String(req.query.code));
  apiUrl.searchParams.set('context', String(req.query.context));
  apiUrl.searchParams.set('CollectiveId', String(req.query.CollectiveId));
  apiUrl.searchParams.set('state', String(req.query.state));

  const result = await fetch(apiUrl, {
    method: 'GET',
    headers: pick(req.headers, [...FORWARDED_HEADERS]),
  });

  res.redirect(result.url);
}
