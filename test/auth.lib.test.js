// dependencies
import jwt from 'jsonwebtoken';
import config from 'config';

// testing tools
import sinon from 'sinon';
import { expect } from 'chai';

// what's being tested
import * as auth from '../server/lib/auth';

describe('authlib', () => {
  it('should generate valid tokens', () => {
    // Given that time `Date.now` returns zero (0)
    const clock = sinon.useFakeTimers();

    // When the token is generated
    const token = auth.createJwt('subject', { foo: 'bar' }, 5);

    // Then the token should be verifiable
    const decoded = jwt.verify(token, config.keys.opencollective.secret);
    clock.restore();

    // And then it should contain all the important fields
    expect(decoded.sub).to.equal('subject');
    expect(decoded.exp).to.equal(5);
    expect(decoded.foo).to.equal('bar');
  });

  it('should validate tokens', () => {
    const token = auth.createJwt('sub', {}, 5);
    expect(Boolean(auth.verifyJwt(token))).to.be.true;
  });
});
