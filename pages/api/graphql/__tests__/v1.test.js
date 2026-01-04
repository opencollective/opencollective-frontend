/**
 * Tests for GraphQL v1 API proxy
 * See: https://github.com/opencollective/opencollective-frontend/issues/11772
 */

import { Readable } from 'stream';

// Mock fetch globally
global.fetch = jest.fn();

// Set required env vars
process.env.API_URL = 'https://api.opencollective.com';
process.env.API_KEY = 'test-api-key';

/**
 * Create a mock request that works as a stream (for bodyParser: false)
 */
function createMockRequest({ method, headers, body }) {
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body || '');
  const stream = Readable.from([bodyBuffer]);

  return Object.assign(stream, {
    method,
    headers: headers || {},
  });
}

/**
 * Create a mock response
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    _getJSONData() {
      return this.body;
    },
  };
  return res;
}

describe('pages/api/graphql/v1', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Import fresh for each test
    handler = require('../v1').default;
  });

  describe('JSON requests', () => {
    it('should forward JSON requests with stringified body', async () => {
      const mockResponse = { data: { Collective: { id: '123' } } };
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const jsonBody = {
        query: '{ Collective(slug: "test") { id } }',
        variables: {},
      };

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer test-token',
        },
        body: JSON.stringify(jsonBody),
      });

      const res = createMockResponse();

      await handler(req, res);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/graphql/v1'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(jsonBody),
        }),
      );
      expect(res._getJSONData()).toEqual(mockResponse);
    });
  });

  describe('multipart requests', () => {
    it('should forward multipart requests without JSON stringifying the body', async () => {
      const mockResponse = {
        data: {
          uploadFile: {
            file: { id: 'file-123', url: 'https://example.com/file.pdf' },
          },
        },
      };
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      // Simulate multipart form data request
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const multipartBody = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="operations"',
        '',
        '{"query":"mutation Upload { upload { url } }","variables":{}}',
        `--${boundary}`,
        'Content-Disposition: form-data; name="map"',
        '',
        '{"0":["variables.file"]}',
        `--${boundary}`,
        'Content-Disposition: form-data; name="0"; filename="test.pdf"',
        'Content-Type: application/pdf',
        '',
        'PDF file content here',
        `--${boundary}--`,
      ].join('\r\n');

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          authorization: 'Bearer test-token',
        },
        body: multipartBody,
      });

      const res = createMockResponse();

      await handler(req, res);

      // The key assertion: multipart body should NOT be JSON stringified
      const fetchCall = global.fetch.mock.calls[0];
      const sentBody = fetchCall[1].body;

      // For multipart, the body should be a Buffer (raw data), not a JSON string
      expect(Buffer.isBuffer(sentBody)).toBe(true);
      expect(sentBody.toString()).toBe(multipartBody);

      // Verify it was NOT JSON stringified (would start with a quote)
      expect(sentBody.toString()).not.toMatch(/^"/);

      expect(res._getJSONData()).toEqual(mockResponse);
    });

    it('should preserve multipart content-type header with boundary', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: {} }),
      });

      const boundary = '----TestBoundary';
      const req = createMockRequest({
        method: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          authorization: 'Bearer test-token',
        },
        body: `--${boundary}--`,
      });

      const res = createMockResponse();

      await handler(req, res);

      const fetchCall = global.fetch.mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['content-type']).toContain('multipart/form-data');
      expect(headers['content-type']).toContain(boundary);
    });
  });

  describe('config', () => {
    it('should export config with bodyParser disabled', () => {
      const { config } = require('../v1');
      expect(config).toEqual({
        api: {
          bodyParser: false,
        },
      });
    });
  });
});
