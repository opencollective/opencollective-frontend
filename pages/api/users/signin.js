export default async function handle(req, res) {
  const apiUrl = `${process.env.API_URL}/users/signin?api_key=${process.env.API_KEY}`;

  const result = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  const json = await result.json();
  const statusCode = result.status;

  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(json);
}
