/** @module test.stores
 *
 * Helpers for interacting with the database models. */
import models from '../../../../server/models';

/** Randomize email since it's a unique key in the database
 *
 * @param {String} email An email address to be randomized.
 * @return {String} the email with a random string attached to it
 *  without making it an invalid address.
 * @example
 * > randEmail('foo@bar.com')
 * 'foo-lh1r2qglj3a@bar.com'
 * > randEmail('foo@bar.com')
 * 'foo-lwfi9uaq9ua@bar.com'
 */
export function randEmail(email) {
  const [user, domain] = email.replace(/\s/g, '-').split('@');
  const rand = Math.random().toString(36).substring(2, 15);
  return `${user}-${rand}@${domain}`;
}

/** Create a new user with a collective
 *
 * @param {String} name is the name of the new user. The email created
 *  for the user will be `{name}@oc.com`.
 * @return {Object} with references for `user` and `userCollective`.
 */
export async function newUser(name) {
  const email = randEmail(`${name}@oc.com`);
  const user = await models.User.createUserWithCollective({
    email,
    name,
    username: name,
    description: `A user called ${name}`,
  });
  return { user, userCollective: user.collective };
}

/** Create a new collective with host
 *
 * @param {String} name Name of the collective.
 * @param {String} currency is the currency of the host
 * @param {String} fee is the per transaction Host fee
 * @returns {Object} with references for `hostCollective`,
 *  `hostOwner`, and `collective`.
 */
export async function collectiveWithHost(name, currency, fee) {
  const email = randEmail(`${name}-host-${currency}@oc.com`);
  const hostOwner = await models.User.create({ email });
  const hostCollective = await models.Collective.create({
    CreatedByUserId: hostOwner.id,
    name: `${name} Host`,
    slug: `${name}-host`,
    hostFeePercent: fee ? parseInt(fee) : 0,
    currency,
  });
  const collective = await models.Collective.create({ name });
  await collective.addHost(hostCollective);
  await hostOwner.update({ CollectiveId: hostCollective.id });
  return { hostCollective, hostOwner, collective };
}
