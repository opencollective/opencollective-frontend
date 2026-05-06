/* eslint-disable camelcase */
/**
 * Unit tests for the /api/github-repositories Next.js proxy.
 *
 * Verifies that the proxy forwards the Authorization header to the API
 * and does NOT accept or forward access_token as a query parameter
 * (security regression from the GitHub OAuth token-leakage fix).
 */

import handler from '../github-repositories';

const makeReq = (headers = {}, query = {}) => ({ headers, query });
const makeRes = () => {
  const headers = {};
  return {
    setHeader: jest.fn((key, val) => {
      headers[key] = val;
    }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    _headers: headers,
  };
};

describe('/api/github-repositories proxy', () => {
  let fetchMock;

  beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    process.env.API_KEY = 'test-api-key';

    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue([{ id: 1, name: 'test-repo' }]),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('forwards the Authorization header to the API', async () => {
    const req = makeReq({ authorization: 'Bearer connected-account-jwt' });
    const res = makeRes();

    await handler(req, res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.authorization).toBe('Bearer connected-account-jwt');
  });

  it('does NOT forward access_token as a query parameter (security regression)', async () => {
    const req = makeReq({}, { access_token: 'victim-session-jwt' });
    const res = makeRes();

    await handler(req, res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl.toString()).not.toContain('access_token=victim-session-jwt');
  });

  it('always includes api_key in the URL', async () => {
    const req = makeReq({ authorization: 'Bearer some-token' });
    const res = makeRes();

    await handler(req, res);

    const [calledUrl] = fetchMock.mock.calls[0];
    expect(new URL(calledUrl.toString()).searchParams.get('api_key')).toBe('test-api-key');
  });

  it('returns the JSON from the API with the correct status', async () => {
    const repos = [{ id: 1, name: 'my-repo', stargazers_count: 500 }];
    fetchMock.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(repos) });

    const req = makeReq({ authorization: 'Bearer some-token' });
    const res = makeRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(repos);
  });
});
