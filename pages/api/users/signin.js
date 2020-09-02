export default async function handle(req, res) {
  const graphqlUrl = `${process.env.API_URL}/users/signin?api_key=${process.env.API_KEY}`;

  const json = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  }).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
