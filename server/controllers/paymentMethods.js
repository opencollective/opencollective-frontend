import models, { Op } from '../models';
import { extend, get, pick, pluck } from 'lodash';
import * as utils from '../graphql/utils';
const { PaymentMethod } = models;

const createPaymentMethodQuery = `
  mutation createPaymentMethod($amount: Int!, $CollectiveId: Int!, $PaymentMethodId: Int, $description: String, $expiryDate: String, $type: String!) {
    createPaymentMethod(amount: $amount, CollectiveId: $CollectiveId, PaymentMethodId: $PaymentMethodId, description: $description, expiryDate: $expiryDate, type: $type) {
      id
      name
      uuid
      collective {
        id
      }
      SourcePaymentMethodId
      initialBalance
      expiryDate
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
  const query = extend({}, filter, { CollectiveId: req.user.CollectiveId, confirmedAt: { [Op.ne]: null } });

  return PaymentMethod.findAll({ where: query })
  .then((response) => {
    res.send(pluck(response, 'info'));
  })
  .catch(next);
}

async function createVirtualCardThroughGraphQL(args, user) {
  const gqlResult = await utils.graphqlQuery(createPaymentMethodQuery, args, user);
  if (!get(gqlResult, 'data.createPaymentMethod')) {
    throw Error('Graphql Query did not return a result');
  }
  const paymentMethod = gqlResult.data.createPaymentMethod;
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    CollectiveId: paymentMethod.collective.id,
    SourcePaymentMethodId: paymentMethod.SourcePaymentMethodId,
    balance: paymentMethod.initialBalance,
    code: paymentMethod.uuid.slice(-8),
    expiryDate: paymentMethod.expiryDate,
  };
}

/**
 * Creates a virtual card given (at least) an amount and a
 * CollectiveId(if the logged in user is and admin of the collective).
 */
export function createVirtualCard(req, res, next) {

  const args = pick(req.body, ['description','CollectiveId','PaymentMethodId','amount','expiryDate']);
  args.type = args.type || 'virtualcard';

  return createVirtualCardThroughGraphQL(args, req.remoteUser)
  .then(response => {
    res.send(response);
  })
  .catch(next);
}

export function createPaymentMethod(req, res, next) {
  // We only support creation of "virtualcard" payment methods
  if (get(req, 'body.type') && get(req, 'body.type') !== 'virtualcard') {
    throw Error(`Creation of payment methods with type ${get(req, 'body.type')} not Allowed`);
  }
  return createVirtualCard(req, res, next);
}
