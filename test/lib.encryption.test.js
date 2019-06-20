import { expect } from 'chai';
import { generateKey, encrypt, decrypt } from '../server/lib/encryption';

describe('lib.encryption', () => {
  it('it encrypts and decrypts ok', () => {
    const message = 'OpenCollective Rules';
    const buff = Buffer.from(message);
    const key = generateKey();

    const encrypted = encrypt(buff, key);

    const result = decrypt(encrypted, key);

    expect(result).to.eq(message);
  });
});
