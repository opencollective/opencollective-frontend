import config from 'config';
import moment from 'moment';
import models, { Op } from '../models';
import { extend, get, pick, pluck } from 'lodash';
import * as utils from '../graphql/utils';
const { PaymentMethod } = models;

const createPaymentMethodQuery = `
  mutation createPaymentMethod($amount: Int!, $CollectiveId: Int!, $PaymentMethodId: Int, $description: String, $expiryDate: String, $type: String!, $currency: String!) {
    createPaymentMethod(amount: $amount, CollectiveId: $CollectiveId, PaymentMethodId: $PaymentMethodId, description: $description, expiryDate: $expiryDate, type: $type, currency: $currency) {
      id
      name
      uuid
      collective {
        id
      }
      SourcePaymentMethodId
      initialBalance
      expiryDate
      currency
    }
  }
`;
/**
 * Get the paymentMethods of the user.
 *
 * We use the method to know if the user need to confirm her/his paypal
 * account
 */
export function getPaymentMethods(req, res, next) {
  const { filter } = req.query;
  const query = extend({}, filter, {
    CollectiveId: req.user.CollectiveId,
    confirmedAt: { [Op.ne]: null },
  });

  return PaymentMethod.findAll({ where: query })
    .then(response => {
      res.send(pluck(response, 'info'));
    })
    .catch(next);
}

async function createVirtualCardThroughGraphQL(args, user) {
  const gqlResult = await utils.graphqlQuery(
    createPaymentMethodQuery,
    args,
    user,
  );
  if (!get(gqlResult, 'data.createPaymentMethod')) {
    const error = gqlResult.errors
      ? gqlResult.errors[0]
      : Error('Graphql Query did not return a result');
    throw error;
  }
  const paymentMethod = gqlResult.data.createPaymentMethod;
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    CollectiveId: paymentMethod.collective.id,
    balance: paymentMethod.initialBalance,
    currency: paymentMethod.currency,
    code: paymentMethod.uuid.substring(0, 8),
    expiryDate: moment(paymentMethod.expiryDate).format(),
    redeemUrl: `${
      config.host.website
    }/redeem?code=${paymentMethod.uuid.substring(0, 8)}`,
  };
}

/**
 * Creates a virtual card given (at least) an amount and a
 * CollectiveId(if the logged in user is and admin of the collective).
 */
export function createVirtualCard(req, res) {
  const args = pick(req.body, [
    'description',
    'CollectiveId',
    'PaymentMethodId',
    'amount',
    'currency',
    'expiryDate',
  ]);
  args.type = args.type || 'virtualcard';

  return createVirtualCardThroughGraphQL(args, req.remoteUser)
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      res.status(400).send({ error: error.toString() });
    });
}

export function createPaymentMethod(req, res, next) {
  // We only support creation of "virtualcard" payment methods
  if (get(req, 'body.type') && get(req, 'body.type') !== 'virtualcard') {
    throw Error(
      `Creation of payment methods with type ${get(
        req,
        'body.type',
      )} not Allowed`,
    );
  }
  return createVirtualCard(req, res, next);
}
