/**
 * Unit tests for the /api/connected-accounts/[service]/callback Next.js proxy.
 *
 * Verifies that the proxy correctly forwards OAuth callback parameters to the API
 * and - crucially - does NOT forward access_token (security regression).
 */

import handler from '../[service]/callback';

jest.mock('../../../../lib/constants/oauth', () => ({
  oauthServiceAllowlist: new Set(['github', 'stripe', 'transferwise', 'paypal']),
}));

const makeReq = (service, query = {}) => ({
  query: { service, ...query },
  headers: { accept: 'text/html', 'user-agent': 'test' },
});

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('connected-accounts callback proxy', () => {
  let fetchSpy;

  beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    process.env.API_KEY = 'test-api-key';

    fetchSpy = jest.fn().mockResolvedValue({ url: 'http://frontend.test/redirect-target' });
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('rejects unknown services with 404', async () => {
    const req = makeReq('unknown-service');
    const res = makeRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('forwards code, context, CollectiveId and state to the API', async () => {
    const req = makeReq('github', {
      code: 'github-code-123',
      state: 'my-state-uuid',
      context: 'createCollective',
      CollectiveId: 'my-org',
    });
    const res = makeRes();

    await handler(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0];
    const url = new URL(calledUrl);

    expect(url.searchParams.get('code')).toBe('github-code-123');
    expect(url.searchParams.get('state')).toBe('my-state-uuid');
    expect(url.searchParams.get('context')).toBe('createCollective');
    expect(url.searchParams.get('CollectiveId')).toBe('my-org');
    expect(url.searchParams.get('api_key')).toBe('test-api-key');
  });

  it('does NOT forward access_token to the API (security regression)', async () => {
    const req = makeReq('github', {
      code: 'github-code-123',
      state: 'my-state-uuid',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.victim-jwt',
    });
    const res = makeRes();

    await handler(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0];
    const url = new URL(calledUrl);

    expect(url.searchParams.has('access_token')).toBe(false);
    expect(url.toString()).not.toContain('access_token');
  });

  it('redirects the browser to the URL returned by the API', async () => {
    const expectedRedirect = 'http://frontend.test/result-page';
    fetchSpy.mockResolvedValue({ url: expectedRedirect });

    const req = makeReq('github', { code: 'abc', state: 'uuid-123' });
    const res = makeRes();

    await handler(req, res);

    expect(res.redirect).toHaveBeenCalledWith(expectedRedirect);
  });

  it('works for non-github services (stripe)', async () => {
    const req = makeReq('stripe', { code: 'stripe-code', state: 'stripe-state' });
    const res = makeRes();

    await handler(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl.toString()).toContain('/connected-accounts/stripe/callback');
  });
});
