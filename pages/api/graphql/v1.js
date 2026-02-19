import { pick } from 'lodash';

/**
 * GraphQL v1 API proxy
 *
 * Handles both JSON and multipart requests:
 * - JSON requests are parsed and forwarded with stringified body
 * - Multipart requests (file uploads) are forwarded with raw body
 *
 * See: https://github.com/opencollective/opencollective-frontend/issues/11772
 */

// Disable Next.js body parsing to handle multipart requests properly
// ts-unused-exports:disable-next-line
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Collect raw body from request stream
 */
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Check if request is multipart/form-data
 */
function isMultipart(req) {
  const contentType = req.headers['content-type'] || '';
  return contentType.includes('multipart/form-data');
}

// next.js export
// ts-unused-exports:disable-next-line
export default async function handle(req, res) {
  const graphqlUrl = `${process.env.API_URL}/graphql/v1?api_key=${process.env.API_KEY}`;

  const headers = pick(req.headers, [
    'accept',
    'content-type',
    'authorization',
    'user-agent',
    'accept-language',
    'x-two-factor-authentication',
  ]);

  let body;

  try {
    if (isMultipart(req)) {
      // For multipart requests, forward the raw body without modification
      body = await getRawBody(req);
    } else {
      // For JSON requests, parse and re-stringify (existing behavior)
      const rawBody = await getRawBody(req);
      try {
        const jsonBody = JSON.parse(rawBody.toString() || '{}');
        body = JSON.stringify(jsonBody);
      } catch (e) {
        // Return 400 for malformed JSON instead of crashing with 500
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({
          errors: [
            {
              message: `Invalid JSON in request body: ${e.message}`,
              extensions: { code: 'BAD_REQUEST' },
            },
          ],
        });
      }
    }
  } catch (e) {
    // Handle stream errors (e.g., client disconnect during upload)
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      errors: [
        {
          message: `Error reading request body: ${e.message}`,
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        },
      ],
    });
  }

  const result = await fetch(graphqlUrl, {
    method: req.method,
    headers,
    body,
  });

  const json = await result.json();

  res.setHeader('Content-Type', 'application/json');
  res.json(json);
}
