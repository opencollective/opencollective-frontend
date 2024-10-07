import { pick } from 'lodash';

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req, res) {
  const apiUrl = `${process.env.API_URL}/users/two-factor-auth?api_key=${process.env.API_KEY}`;

  const result = await fetch(apiUrl, {
    method: req.method,
    headers: pick(req.headers, ['accept', 'content-type', 'authorization', 'user-agent', 'accept-language']),
    body: JSON.stringify(req.body),
  });

  const json = await result.json();

  result.headers
    .getSetCookie()
    .filter(cookie => cookie.includes('accessTokenPayload') || cookie.includes('accessTokenSignature'))
    .forEach(cookie => res.appendHeader('Set-Cookie', cookie));
  res.setHeader('Content-Type', 'application/json');
  res.status(result.status).json(json);
}
