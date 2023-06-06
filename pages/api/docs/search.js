export default async function handle(req, res) {
  const { query } = req.query;
  const apiUrl = new URL(`${process.env.API_URL}/docs/search?api_key=${process.env.API_KEY}`);
  apiUrl.searchParams.set('query', query);

  const json = await fetch(apiUrl).then(result => result.json());

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
