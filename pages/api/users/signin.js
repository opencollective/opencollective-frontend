// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req, res) {
  const apiUrl = `${process.env.API_URL}/users/signin?api_key=${process.env.API_KEY}`;

  const result = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  const json = await result.json();
  const statusCode = result.status;

  result.headers
    .getSetCookie()
    .filter(cookie => cookie.includes('accessTokenPayload') || cookie.includes('accessTokenSignature'))
    .forEach(cookie => res.appendHeader('Set-Cookie', cookie));
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(json);
}
