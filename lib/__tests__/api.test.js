import * as api from '../api.ts';

describe('get', () => {
  const externalPathError = 'Can only get resources with a relative path';

  it('raise if not an absolute path', () => {
    expect(() => api.get('hello-world/file.pdf')).toThrow(externalPathError);
  });

  test('raise if given an external URL without allowExternal', () => {
    expect(() => api.get('http://google.fr')).toThrow(externalPathError);
  });
});

describe('getGithubRepos', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('sends the token in the Authorization header', async () => {
    await api.getGithubRepos('my-connected-account-jwt');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/github-repositories',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-connected-account-jwt' }),
      }),
    );
  });

  it('does NOT include access_token in the URL (security regression)', async () => {
    await api.getGithubRepos('my-connected-account-jwt');

    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain('access_token');
  });
});
