export default async function handle(req, res) {
  const graphqlUrl = `${process.env.API_URL}/users/update-token?api_key=${process.env.API_KEY}`;

  const Authorization = req.headers['authorization'];
  const Accept = req.headers['accept'];

  const json = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { Authorization, Accept },
    body: JSON.stringify(req.body),
  }).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
