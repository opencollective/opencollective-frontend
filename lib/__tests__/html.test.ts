import { stripHTML } from '../html';

describe('html lib', () => {
  it('strips tags and scripts', () => {
    expect(stripHTML('<b>hi</b><script>alert(1)</script>')).toEqual('hi');
  });
});
