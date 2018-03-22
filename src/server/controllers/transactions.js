import { fetchTransaction, fetchTransactions, fetchInvoice } from '../lib/graphql';
import pdf from 'html-pdf';

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
  // Keeping the resulting info for 10mn in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
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

export async function invoice(req, res, next) {
  // Keeping the resulting info for 10mn in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let invoice, html;
  const authorizationHeader = req.headers && req.headers.authorization;
  if (!authorizationHeader) return next(new Error("Not authorized. Please provide an accessToken."));

  const parts = authorizationHeader.split(' ');
  const scheme = parts[0];
  const accessToken = parts[1];
  if (!/^Bearer$/i.test(scheme) || !accessToken) {
    return next(new Error('Invalid authorization header. Format should be: Authorization: Bearer [token]'));
  }

  const { collectiveSlug, invoiceSlug, format } = req.params;

  try {
    invoice = await fetchInvoice(invoiceSlug, accessToken);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    console.log(">>> error message", e.message);
    return next(e);
  }
  
  const pageFormat = (req.query.pageFormat === 'A4' || invoice.fromCollective.currency === 'EUR')
    ? 'A4'
    : 'Letter';

  const params = {
    invoice,
    pageFormat
  };

  switch (format) {
    case 'json':
      res.send(invoice);
      break;
    case 'html':
      html = await req.app.renderToHTML(req, res, `/invoice`, params);
      res.send(html);
      break;
    case 'pdf':
      html = await req.app.renderToHTML(req, res, `/invoice`, params);
      const options = {
        format: pageFormat,
        renderDelay: 3000
      };
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'');
      const filename = `${invoice.slug}.pdf`;

      res.setHeader('content-type','application/pdf');
      res.setHeader('content-disposition', `inline; filename="${filename}"`); // or attachment?
      pdf.create(html, options).toStream((err, stream) => {
        if (err) {
          console.log(">>> error while generating pdf", req.url, err);
          return next(err);
        }
        stream.pipe(res);
      });
      break;
  }

}