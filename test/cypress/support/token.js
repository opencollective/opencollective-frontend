import { SignJWT } from 'jose';

// We put the jwt secret here because we should never set it in production.
// Setting it in config could result in the entry being set by the person who deploys.
const TEST_JWT_SECRET = 'vieneixaGhahk2aej2pohsh2aeB1oa6o';

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
export default function generateToken(expiresIn = 3000000) {
  return new SignJWT({
    id: 9474,
    sub: 9474,
    scope: 'login',
    email: 'testuser+admin@opencollective.com',
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(TEST_JWT_SECRET));
}
