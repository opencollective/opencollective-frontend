import virtualcard from '../../../paymentProviders/opencollective/virtualcard';
import emailLib from '../../../lib/email';
import models from '../../../models';
import queryString from 'query-string';

/** Create a Payment Method through a collective(organization or user)
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 */
export async function createPaymentMethod(args, remoteUser) {
  // We only support the creation of virtual cards payment methods at the moment
  if (!args || !args.type || args.type != 'virtualcard') {
    throw Error('Creation of Payment Method not allowed.');
  }
  return createVirtualPaymentMethod(args, remoteUser);
}

/** Create the Virtual Card Payment Method through an organization
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {String} [args.description] The description of the new payment
 *  method.
 * @param {Number} args.CollectiveId The ID of the organization creating the virtual card.
 * @param {Number} [args.PaymentMethodId] The ID of the Source Payment method the
 *                 organization wants to use
 * @param {Number} args.amount The total amount that will be
 *  credited to the newly created payment method.
 * @param {String} args.currency The currency of the virtual card
 * @param {[limitedToTags]} [args.limitedToTags] Limit this payment method to donate to collectives having those tags
 * @param {Date} [args.expiryDate] The expiry date of the payment method
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
async function createVirtualPaymentMethod(args, remoteUser) {
  if (!remoteUser) {
    throw new Error('You need to be logged in to create this payment method.');
  }
  if (!remoteUser.isAdmin(args.CollectiveId)) {
    throw new Error('You must be an admin of this Collective.');
  }
  // making sure it's a string, trim and uppercase it.
  args.currency = args.currency.toString().toUpperCase();
  if (!['USD', 'EUR'].includes(args.currency)) {
    throw new Error(`Currency ${args.currency} not supported. We only support USD and EUR at the moment.`);
  }
  const paymentMethod = await virtualcard.create(args, remoteUser);
  return paymentMethod;
}

/** Claim the Virtual Card Payment Method By an (existing or not) user
 * @param {Object} args contains the parameters
 * @param {String} args.code The 8 last digits of the UUID
 * @param {String} args.email The email of the user claiming the virtual card
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
export async function claimPaymentMethod(args, remoteUser) {
  const paymentMethod = await virtualcard.claim(args, remoteUser);
  const user = await models.User.findOne({
    where: { CollectiveId: paymentMethod.CollectiveId },
  });
  const { initialBalance, monthlyLimitPerMember, currency, name, expiryDate } = paymentMethod;
  const amount = initialBalance || monthlyLimitPerMember;
  const emitter = await models.Collective.findById(paymentMethod.sourcePaymentMethod.CollectiveId);

  const qs = queryString.stringify({
    code: paymentMethod.uuid.substring(0, 8),
  });
  emailLib.send('user.card.claimed', user.email, {
    loginLink: user.generateLoginLink(`/redeemed?${qs}`),
    initialBalance: amount,
    name,
    currency,
    expiryDate,
    emitter,
  });
  return paymentMethod;
}
