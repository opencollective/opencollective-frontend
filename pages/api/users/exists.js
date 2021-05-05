import { URL } from 'url';

export default async function handle(req, res) {
  const apiUrl = new URL(`${process.env.API_URL}/users/exists?api_key=${process.env.API_KEY}`);
  apiUrl.searchParams.set('email', req.query.email);

  const json = await fetch(apiUrl).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
