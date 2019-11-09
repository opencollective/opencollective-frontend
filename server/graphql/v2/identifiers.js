import crypto from 'crypto';

import config from 'config';
import Hashids from 'hashids/cjs';

const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz';

let salt = config.keys.opencollective.hashidSalt;
if (!salt) {
  console.warn('Please define HASHID_SALT to get permanent public ids.');
  salt = crypto.randomBytes(64).toString('hex');
}

const instances = {};

const getInstance = type => {
  let instance = instances[type];
  if (!instance) {
    instance = instances[type] = new Hashids(salt + type, 32, alphabet);
  }
  return instance;
};

export const idEncode = (integer, type) => {
  const string = getInstance(type).encode(integer);
  const sliced = [string.substring(0, 8), string.substring(8, 16), string.substring(16, 24), string.substring(24, 32)];
  return sliced.join('-');
};

export const idDecode = (string, type) => {
  return getInstance(type).decode(string.split('-').join(''));
};

/**
 * Returns a function to be used as the resolver for identifier fields.
 * The returned resolver function encodes the identifier field (idField)
 * @param {string} type - Type the fields belongs to. For example: 'comment' and 'transaction'
 * @param {string} idField - Field that represents the id. By default 'id'
 */
export const getIdEncodeResolver = (type, idField = 'id') => entity => idEncode(entity[idField], type);

/**
 * Resolve original id by decoding if string, otherwise return as is.
 * @param {number|string} id - ide to decode
 * @returns {number} decoded id
 */
export function getDecodedId(id) {
  return isNaN(id) && typeof id === 'string'
    ? idDecode(id)[0] // idDecode returns an array.
    : id;
}
