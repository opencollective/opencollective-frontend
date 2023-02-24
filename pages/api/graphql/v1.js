import { pick } from 'lodash';

export default async function handle(req, res) {
  const graphqlUrl = `${process.env.API_URL}/graphql/v1?api_key=${process.env.API_KEY}`;

  const result = await fetch(graphqlUrl, {
    method: req.method,
    headers: pick(req.headers, [
      'accept',
      'content-type',
      'authorization',
      'user-agent',
      'accept-language',
      'x-two-factor-authentication',
    ]),
    body: JSON.stringify(req.body),
  });

  const json = await result.json();

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
