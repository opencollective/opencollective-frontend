const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

/* Helper to enable downloading files that are on S3 since Chrome and Firefox does 
   not allow cross-origin downloads when using the download attribute on an anchor tag, 
   see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download. */
async function downloadFileHandler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const hostname = req.get('original-hostname') || req.hostname;
  const isProd = hostname === 'opencollective.com';

  const S3Url = new RegExp(
    `^https:\\/\\/opencollective-${isProd ? 'production' : 'staging'}\\.s3[.-]us-west-1\\.amazonaws\\.com`,
  );

  const RestApiCsvTransactionsUrl = new RegExp(
    `^https:\\/\\/rest${isProd ? '' : '-staging'}\\.opencollective\\.com\\/v2\\/[^/]+\\/transactions\\.csv`,
  );

  if (!S3Url.test(url) && !RestApiCsvTransactionsUrl.test(url)) {
    return res.status(400).json({
      error:
        'Only files from Open Collective S3 buckets and specific REST API are allowed - to the correct environment',
    });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unexpected response: ${response.statusText}`);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = url.split('/').pop();

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="([^"]*)"/i);
    if (match && match[1]) {
      fileName = match[1];
    }
  }

  res.setHeader('Content-Type', response.headers.get('Content-Type'));
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  await streamPipeline(response.body, res);
}

module.exports = downloadFileHandler;
