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

  const apiUrl = new URL(`${process.env.API_URL}/connected-accounts/${service}/oauthUrl`);
  apiUrl.searchParams.set('api_key', String(process.env.API_KEY));

  const validQueryParams = ['redirect', 'CollectiveId', 'context'];
  validQueryParams.forEach(param => {
    if (req.query[param]) {
      apiUrl.searchParams.set(param, String(req.query[param]));
    }
  });

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: pick(req.headers, [...FORWARDED_HEADERS]),
  });

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    res.redirect(response.url);
  } else {
    try {
      res.status(response.status).json(await response.json());
    } catch {
      res.status(response.status).send({ code: response.status, message: 'Unknown error' });
    }
  }
}
