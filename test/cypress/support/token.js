// We put the jwt secret here because we should never set it in production.
// Setting it in config could result in the entry being set by the person who deploys.
const TEST_JWT_SECRET = 'vieneixaGhahk2aej2pohsh2aeB1oa6o';

function jwtSign(data, key) {
  window.crypto.subtle
    .importKey(
      'jwk', // can be "jwk" or "raw"
      {
        // this is an example jwk key, "raw" would be an ArrayBuffer
        kty: 'oct',
        k: key,
        alg: 'HS256',
        ext: true,
      },
      {
        // this is the algorithm options
        name: 'HMAC',
        hash: { name: 'SHA-256' }, // can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        // length: 256, //optional, if you want your key length to differ from the hash function's block length
      },
      true, // whether the key is extractable (i.e. can be used in exportKey)
      ['sign', 'verify'], // can be any combination of "sign" and "verify"
    )
    .then(key => {
      const jsonString = JSON.stringify(data);
      const encodedData = new TextEncoder().encode(jsonString);

      return window.crypto.subtle.sign(
        {
          name: 'HMAC',
        },
        key, // from generateKey or importKey above
        encodedData, // ArrayBuffer of data you want to sign
      );
    })
    .then(token => {
      const u8 = new Uint8Array(token);
      const b64encoded = btoa(String.fromCharCode.apply(null, u8));

      return b64encoded;
    });
}

/**
 * Generate an authentication token to...
 *
 *   1. Avoid API callbacks when we can
 *   2. Simulate special login URLs (like the approve collective one) that
 *      would normally be sent by email
 *   3. Generate custom tokens - for example expired tokens - for advanced login
 *      testing.
 *
 * @param `user`: An object with `id` set. Default to default test user id
 * @param `expiresIn`: An expiry duration, default to 1h. Set to a negative value
 *                     to generate an expired token.
 */
export default function generateToken(user, expiresIn = 3000000) {
  const defaultUser = {
    id: 9474,
    sub: 9474,
    scope: 'login',
    email: 'testuser+admin@opencollective.com',
    exp: new Date(Date.now() + expiresIn).toISOString(),
  };
  return jwtSign(user || defaultUser, TEST_JWT_SECRET);
}
