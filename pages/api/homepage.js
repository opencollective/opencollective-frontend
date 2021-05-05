export default async function handle(req, res) {
  const apiUrl = `${process.env.API_URL}/homepage?api_key=${process.env.API_KEY}`;

  const json = await fetch(apiUrl).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
