import { URL } from 'url';

import { pick } from 'lodash';

export default async function handle(req, res) {
  const { service } = req.query;
  const apiUrl = new URL(
    `${process.env.API_URL}/connected-accounts/${service}/oauthUrl?api_key=${process.env.API_KEY}`,
  );

  const validQueryParams = ['redirect', 'CollectiveId', 'context'];
  validQueryParams.forEach(param => {
    if (req.query[param]) {
      apiUrl.searchParams.set(param, req.query[param]);
    }
  });

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: pick(req.headers, ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language']),
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
