import fetch from 'node-fetch';

export default async function handle(req, res) {
  const graphqlUrl = `${process.env.API_URL}/users/update-token?api_key=${process.env.API_KEY}`;

  const Authorization = req.headers['authorization'];

  const json = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { Authorization },
  }).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
