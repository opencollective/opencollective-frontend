import { URL } from 'url';

import { pick } from 'lodash';

import { oauthServiceAllowlist } from '@/lib/constants/oauth';

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req, res) {
  const { service } = req.query;
  if (!oauthServiceAllowlist.has(service)) {
    return res.status(404).send({ code: 404, message: 'Service not supported' });
  }

  const apiUrl = new URL(`${process.env.API_URL}/connected-accounts/${service}/callback`);
  apiUrl.searchParams.set('api_key', process.env.API_KEY);
  apiUrl.searchParams.set('code', req.query.code);
  apiUrl.searchParams.set('context', req.query.context);
  apiUrl.searchParams.set('access_token', req.query.access_token);
  apiUrl.searchParams.set('CollectiveId', req.query.CollectiveId);
  apiUrl.searchParams.set('state', req.query.state);

  const result = await fetch(apiUrl, {
    method: 'GET',
    headers: pick(req.headers, ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language']),
  });

  res.redirect(result.url);
}
