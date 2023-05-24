const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

async function downloadFileHandler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  } else if (!/https:\/\/opencollective-(production|staging)\.s3[.-]us-west-1\.amazonaws\.com/.test(url)) {
    return res.status(400).json({ error: 'Only files from Open Collecive are allowed' });
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unexpected response: ${response.statusText}`);
  }

  const fileName = url.split('/').pop();
  res.setHeader('Content-Type', response.headers.get('Content-Type'));
  res.setHeader('Content-Disposition', `attachment; ${fileName}`);
  await streamPipeline(response.body, res);
}

module.exports = downloadFileHandler;
