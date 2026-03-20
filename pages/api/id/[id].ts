// maps frontend /id/:id to /api/id/:id
// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req, res) {
  const { id } = req.query;
  res.redirect(`/api/id/${id}`);
}
