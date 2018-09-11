import virtualcard from '../../paymentProviders/opencollective/virtualcard';

/** Create the Virtual Card Payment Method through an organization
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {String} [args.description] The description of the new payment
 *  method.
 * @param {Number} args.CollectiveId The ID of the organization creating the virtual card.
 * @param {Number} [args.PaymentMethodId] The ID of the Source Payment method the
 *                 organization wants to use
 * @param {Number} args.totalAmount The total amount that will be
 *  credited to the newly created payment method.
 * @param {Date} [args.expiryDate] The expiry date of the payment method
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
export async function createVirtualPaymentMethod(args, remoteUser) {
  if (!remoteUser.isAdmin(args.CollectiveId)) {
    throw new Error('Only an admin of a Collective can create Virtual cards on its behalf.');
  }
  const paymentMethod = await virtualcard.create(args);
  return paymentMethod;
}

/** Claim the Virtual Card Payment Method By an (existing or not) user
 * @param {Object} args contains the parameters
 * @param {String} args.code The 8 last digits of the UUID
 * @param {email} args.email The email of the user claiming the virtual card
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
export async function claimVirtualCard(args) {
  const paymentMethod = await virtualcard.claim(args);
  return paymentMethod;
}
