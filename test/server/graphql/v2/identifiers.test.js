import { expect, assert } from 'chai';
import * as identifiers from '../../../../server/graphql/v2/identifiers';

describe('server/graphql/v2/identifiers', () => {
  it('returns same value if number', () => {
    const id = 10;
    expect(identifiers.getDecodedId(id)).to.be.eq(id);
  });
  it('returns decode id', () => {
    const id = 155;
    const encodedId = identifiers.idEncode(155);
    assert.notEqual(id, encodedId);
    expect(identifiers.getDecodedId(encodedId)).to.be.eq(id);
  });
});
