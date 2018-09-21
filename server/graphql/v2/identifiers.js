import crypto from 'crypto';

import Hashids from 'hashids';

const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz';

let salt = process.env.HASHID_SALT;
if (!salt) {
  console.warn('Please define HASHID_SALT to get permanent ids.');
  salt = crypto.randomBytes(64).toString('hex');
}

const hashids = new Hashids(salt, 32, alphabet);

export const idEncode = integer => {
  const string = hashids.encode(integer);
  const sliced = [
    string.substring(0, 8),
    string.substring(8, 16),
    string.substring(16, 24),
    string.substring(24, 32),
  ];
  return sliced.join('-');
};

export const idDecode = string => {
  return hashids.decode(string.split('-').join(''));
};
