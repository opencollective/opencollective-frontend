/** @module test/features/support/stores
 *
 * Helpers for interacting with the database models.
 */
import models from '../../../../server/models';
import * as expenses from '../../../../server/graphql/mutations/expenses';

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
 * @param {Object} data is whatever other data that needs to be passed
 *  to the user's creation. The fields "name", "email", "username" and
 *  "description" can't be overrided.
 * @return {Object} with references for `user` and `userCollective`.
 */
export async function newUser(name, data={}) {
  const email = randEmail(`${name}@oc.com`);
  const user = await models.User.createUserWithCollective({
    ...data,
    email,
    name,
    username: name,
    description: `A user called ${name}`,
  });
  return { user, userCollective: user.collective };
}

/** Create new a host, a collective and add collective to the host
 *
 * @param {String} name Name of the collective.
 * @param {String} currency is the currency of the host
 * @param {String} fee is the per transaction Host fee
 * @returns {Object} with references for `hostCollective`,
 *  `hostOwner`, and `collective`.
 */
export async function hostAndCollective(name, currency, fee) {
  const hostAdmin = (await newUser(`${name}-${currency}-admin`)).user;
  const hostCollective = await models.Collective.create({
    CreatedByUserId: hostAdmin.id,
    name: `${name} Host`,
    slug: `${name}-host`,
    hostFeePercent: fee ? parseInt(fee) : 0,
    currency,
  });
  await hostCollective.addUserWithRole(hostAdmin, 'ADMIN');

  const collective = await models.Collective.create({ name });
  await collective.addHost(hostCollective);
  return { hostCollective, hostAdmin, collective };
}

/** Create a collective and associate to a given host.
 *
 * @param {String} name is the name of the collective being created.
 * @param {models.Collective} hostCollective is an already collective
 *  meant to be the host of the collective being created here.
 * @return {models.Collective} a newly created collective hosted by
 *  `hostCollective`.
 */
export async function collectiveWithHost(name, hostCollective) {
  const collective = await models.Collective.create({ name });
  await collective.addHost(hostCollective);
  return { collective };
}

/** Create a new expense in a collective
 *
 * This is just adds an existing utility to this namespace for
 * consistency.
 * @see {graphql.mutations.expenses.createExpense}.
 *
 * This function uses the `createExpense` mutation to do its
 * job. Which guarantees that expenses created in tests will go
 * through all the same validations as if they were created by users.
 *
 * @param {models.User} user an instance of the User model that will
 *  be used to perform the action of creating the expense.
 * @param {Object} expenseData contains values for the brand new
 *  expense. It especifically waits for the fields `amount`,
 *  `currency`, `description` and `paymentMethod`.
 * @return {models.Expense} newly created expense instance.
 */
export async function createExpense(user, expenseData) {
  return expenses.createExpense(user, expenseData);
}
