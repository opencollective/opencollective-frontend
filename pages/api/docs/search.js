export default async function handle(req, res) {
  const { query } = req.query;
  const apiUrl = `https://api.gitbook.com/v1/spaces/-LWSZizTt4ZC1UNDV89f/search?query=${query}`;

  const result = await fetch(apiUrl, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${process.env.GITBOOK_API_KEY}`,
    },
  });
  const json = await result.json();
  return res.status(result.status).send(json);
}
