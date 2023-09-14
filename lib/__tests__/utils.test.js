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
      expect(utils.isValidRelativeUrl('//')).toEqual(true);

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
  });
});
