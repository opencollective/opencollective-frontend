import { fetchTransaction, fetchTransactions } from '../lib/graphql';

export async function list(req, res, next) {
  // Keeping the resulting info for 10m in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let allTransactions, path = '/';
  if (req.params.collectiveSlug) {
    path += `${req.params.collectiveSlug}/`;
  }
  try {
    allTransactions = await fetchTransactions(req.params.collectiveSlug);
    allTransactions = allTransactions.map(t => {
      t.url = `https://opencollective.com${path}transactions/${t.id}`;
      t.info = `https://opencollective.com${path}transactions/${t.id}.json`;
      if (req.params.collectiveSlug) {
        delete t.collective;
      }
      return t;
    })
    res.send(allTransactions);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    console.log(">>> error message", e.message);
    return next(e);
  }
}

export async function info(req, res, next) {
  // Keeping the resulting info for 48h in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*60*48}`);
  let transaction, path = '';
  if (req.params.collectiveSlug) {
    path += `/${req.params.collectiveSlug}/`;
  }
  try {
    transaction = await fetchTransaction(req.params.id);
    transaction.url = `https://opencollective.com${path}transactions/${transaction.id}`;
    transaction.attendees = `https://opencollective.com${path}transactions/${transaction.id}/attendees.json`;
    res.send(transaction);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    console.log(">>> error message", e.message);
    return next(e);
  }

}