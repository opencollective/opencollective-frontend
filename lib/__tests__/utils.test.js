import * as utils from '../utils.ts';

describe('utils lib', () => {
  it('capitalize', () => {
    expect(utils.capitalize('hello')).toEqual('Hello');
    expect(utils.capitalize('HELLO')).toEqual('HELLO');
    expect(utils.capitalize('')).toEqual('');
    expect(utils.capitalize()).toEqual('');
    expect(utils.capitalize(undefined)).toEqual('');
    expect(utils.capitalize(null)).toEqual('');
    const arr = [undefined];
    expect(utils.capitalize(arr)).toEqual('');
  });

  describe('isValidRelativeUrl', () => {
    it('should return true for relative urls', () => {
      expect(utils.isValidRelativeUrl('/hello')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/world')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/world?i_have_space=it is true')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/world/')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/world/test')).toEqual(true);
      expect(utils.isValidRelativeUrl('/hello/world/test/')).toEqual(true);
      expect(utils.isValidRelativeUrl('/about.html')).toEqual(true);

      // Without `/` prefix
      expect(utils.isValidRelativeUrl('a/b/c/d/e')).toEqual(true);
      expect(utils.isValidRelativeUrl('about.html')).toEqual(true);
    });

    it('should return false for absolute urls', () => {
      expect(utils.isValidRelativeUrl('https://google.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('//google.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('http://google.com')).toEqual(false);
    });

    it('should return false for invalid urls', () => {
      expect(utils.isValidRelativeUrl('//')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\n/xxx')).toEqual(false);
      expect(utils.isValidRelativeUrl('/ /xxx')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\\/xxx')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\\\n/xxx')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\\  /xxx')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\n\\example.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('\\\n/example.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('/ /xxx/')).toEqual(false);
      expect(utils.isValidRelativeUrl('/ /xxx/test')).toEqual(false);
    });

    it('should reject C0-prefixed and backslash protocol-relative urls', () => {
      const nulPrefixed = new URLSearchParams('next=%00%2F%2Fevil.com').get('next');
      const sohPrefixed = new URLSearchParams('next=%01%2F%2Fevil.com').get('next');
      expect(utils.isValidRelativeUrl(nulPrefixed)).toEqual(false);
      expect(utils.isValidRelativeUrl(sohPrefixed)).toEqual(false);
      expect(utils.isValidRelativeUrl('\u0000//evil.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('\u0001//evil.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('/\\evil.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('\\evil.com')).toEqual(false);
      expect(utils.isValidRelativeUrl('//evil.com')).toEqual(false);
    });
  });
});
