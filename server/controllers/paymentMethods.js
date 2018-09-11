import models, { Op } from '../models';
import _, { get } from 'lodash';
import * as utils from '../../test/utils';
const { PaymentMethod } = models;

const createVirtualCardQuery = `
  mutation createVirtualPaymentMethod($totalAmount: Int!, $CollectiveId: Int!, $PaymentMethodId: Int, $description: String, $expiryDate: String) {
    createVirtualPaymentMethod(totalAmount: $totalAmount, CollectiveId: $CollectiveId, PaymentMethodId: $PaymentMethodId, description: $description, expiryDate: $expiryDate) {
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
  const query = _.extend({}, filter, { CollectiveId: req.user.CollectiveId, confirmedAt: { [Op.ne]: null } });

  return PaymentMethod.findAll({ where: query })
  .then((response) => {
    res.send(_.pluck(response, 'info'));
  })
  .catch(next);
}

async function createVirtualCardThroughGraphQL(args, user) {
  const gqlResult = await utils.graphqlQuery(createVirtualCardQuery, args, user);
  if (!get(gqlResult, 'data.createVirtualPaymentMethod')) {
    throw Error('Graphql Query did not return a result');
  }
  const paymentMethod = gqlResult.data.createVirtualPaymentMethod;
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
  if (!get(req, 'remoteUser')) {
    return res.status(401).send('User not logged in');
  }
  if (!get(req, 'body.CollectiveId')) {
    return res.status(400).send('Request Payload does not contain "CollectiveId" field');
  }
  if (!get(req, 'body.totalAmount')) {
    return res.status(400).send('Request Payload does not contain "totalAmount" field');
  }
  const args = {
    description: req.body.description,
    CollectiveId: req.body.CollectiveId,
    PaymentMethodId: req.body.PaymentMethodId,
    totalAmount: req.body.totalAmount,
    expiryDate: req.body.expiryDate,
  };

  return createVirtualCardThroughGraphQL(args, req.remoteUser)
  .then(response => {
    res.send(response);
  })
  .catch(next);
}
