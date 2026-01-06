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
