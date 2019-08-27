import { pick } from 'lodash';
import { URLSearchParams } from 'url';

import virtualcard from '../../../paymentProviders/opencollective/virtualcard';
import { setupCreditCard } from '../../../paymentProviders/stripe/creditcard';
import emailLib from '../../../lib/email';
import models, { Op } from '../../../models';
import { Forbidden, ValidationFailed } from '../../errors';

/** Create a Payment Method through a collective(organization or user)
 *
 * @param {Object} args contains the parameters to create the new payment method
 * @param {Object} remoteUser logged in user
 */
export async function createPaymentMethod(args, remoteUser) {
  if (!remoteUser) {
    throw new Error('You need to be logged in to create this payment method.');
  } else if (!remoteUser.isAdmin(args.CollectiveId)) {
    throw new Error('You must be an admin of this Collective.');
  } else if (!args || !args.type) {
    throw Error('Missing PaymentMethod type');
  } else if (args.type === 'virtualcard') {
    // either amount or monthlyLimitPerMember needs to be present
    if (!args.amount && !args.monthlyLimitPerMember) {
      throw Error('you need to define either the amount or the monthlyLimitPerMember of the payment method.');
    }
    return createVirtualPaymentMethod(args, remoteUser);
  } else if (args.service === 'stripe' && args.type === 'creditcard') {
    return createStripeCreditCard(args, remoteUser);
  } else {
    throw Error('Payment method type not supported');
  }
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
 * @param {Object} remoteUser logged in user
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
async function createVirtualPaymentMethod(args, remoteUser) {
  // making sure it's a string, trim and uppercase it.
  args.currency = args.currency.toString().toUpperCase();
  if (!['USD', 'EUR'].includes(args.currency)) {
    throw new Error(`Currency ${args.currency} not supported. We only support USD and EUR at the moment.`);
  }
  const paymentMethod = await virtualcard.create(args, remoteUser);
  return paymentMethod;
}

/** Add a stripe credit card to given collective */
async function createStripeCreditCard(args, remoteUser) {
  const collective = await models.Collective.findByPk(args.CollectiveId);
  if (!collective) {
    throw Error('This collective does not exists');
  }

  const paymentMethodData = {
    ...args,
    type: 'creditcard',
    service: 'stripe',
    currency: args.currency || collective.currency,
    saved: true,
  };

  let paymentMethod = await models.PaymentMethod.create(paymentMethodData);

  try {
    paymentMethod = await setupCreditCard(paymentMethod, {
      collective,
      user: remoteUser,
    });
  } catch (error) {
    if (!error.stripeResponse) {
      throw error;
    }

    paymentMethod.stripeError = {
      message: error.message,
      response: error.stripeResponse,
    };

    return paymentMethod;
  }

  paymentMethod = await paymentMethod.update({ primary: true });

  // We must unset the `primary` flag on all other payment methods
  await models.PaymentMethod.update(
    { primary: false },
    {
      where: {
        id: { [Op.ne]: paymentMethod.id },
        CollectiveId: collective.id,
        archivedAt: { [Op.eq]: null },
      },
    },
  );

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
  const emitter = await models.Collective.findByPk(paymentMethod.sourcePaymentMethod.CollectiveId);

  const qs = new URLSearchParams({
    code: paymentMethod.uuid.substring(0, 8),
  }).toString();

  // If the User is already authenticated it doesn't need this email
  // It will be redirected to the /redeemed page
  // See: https://github.com/opencollective/opencollective-frontend/blob/08323de06714c20ce33e93bfebcbbeb0af587413/src/pages/redeem.js#L143
  if (!remoteUser) {
    emailLib.send('user.card.claimed', user.email, {
      loginLink: user.generateLoginLink(`/redeemed?${qs}`),
      initialBalance: amount,
      name,
      currency,
      expiryDate,
      emitter,
    });
  }

  return paymentMethod;
}

/** Archive the given payment method */
const PaymentMethodPermissionError = new Forbidden({
  message: "This payment method does not exist or you don't have the permission to edit it.",
});

export async function removePaymentMethod(paymentMethodId, remoteUser) {
  if (!remoteUser) {
    throw PaymentMethodPermissionError;
  }

  // Try to load payment method. Throw permission error if it doesn't exist
  // to prevent attackers from guessing which id is valid and which one is not
  const paymentMethod = await models.PaymentMethod.findByPk(paymentMethodId);
  if (!paymentMethod || !remoteUser.isAdmin(paymentMethod.CollectiveId)) {
    throw PaymentMethodPermissionError;
  }

  // Block the removal if the payment method has subscriptions linked
  const subscriptions = await paymentMethod.getOrders({
    include: [
      {
        model: models.Subscription,
        where: { isActive: true },
        required: true,
      },
    ],
  });

  if (subscriptions.length > 0) {
    throw new ValidationFailed({
      message: 'The payment method has active subscriptions',
      data: { errorId: 'PM.Remove.HasActiveSubscriptions' },
    });
  }

  return paymentMethod.update({ archivedAt: new Date() });
}

/** Update payment method with given args */
export async function updatePaymentMethod(args, remoteUser) {
  const allowedFields = ['name', 'monthlyLimitPerMember'];
  const paymentMethod = await models.PaymentMethod.findByPk(args.id);
  if (!paymentMethod || !remoteUser || !remoteUser.isAdmin(paymentMethod.CollectiveId)) {
    throw PaymentMethodPermissionError;
  }

  return models.PaymentMethod.update(pick(args, allowedFields), { where: { id: paymentMethod.id } });
}
