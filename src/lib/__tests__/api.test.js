import * as api from '../api.js';

describe('get', () => {
  const externalPathError = 'Can only get resources with a relative path';

  it('raise if not an absolute path', () => {
    expect(() => api.get('hello-world/file.pdf')).toThrowError(externalPathError);
  });

  test('raise if given an external URL without allowExternal', () => {
    expect(() => api.get('http://google.fr')).toThrowError(externalPathError);
  });
});
