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
    const decoded = jwt.verify(token, config.keys.opencollective.jwtSecret);
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

  it('should prevent changing the algorithm for validate', () => {
    const payload = { foo: 'bar' };
    const testKey = `-----BEGIN EC PRIVATE KEY-----
MHgCAQEEIQCngKdlZNZLnHz1759Ws3tKUfkyTfh+E9o52L5yzjMQ+KAKBggqhkjO
PQMBB6FEA0IABE6r13quwp3ZFr9SF8k6B0BRiOzAX8UGF1JkV/0KOnyqeTTT9lgW
quLDCejRhHBkI/i5vZXyk4MqC5q4COJlxKU=
-----END EC PRIVATE KEY-----`;
    const maliciousToken = jwt.sign(payload, testKey, {
      subject: String(payload),
      header: {
        alg: 'ES256',
      },
    });

    expect(() => {
      auth.verifyJwt(maliciousToken);
    }).to.throw('invalid algorithm');
  });
});
