import config from 'config';
import moment from 'moment';
import { get, pick } from 'lodash';

import * as utils from '../graphql/v1/utils';

const createPaymentMethodQuery = `
  mutation createPaymentMethod(
    $amount: Int,
    $monthlyLimitPerMember: Int,
    $CollectiveId: Int!,
    $PaymentMethodId: Int,
    $description: String,
    $expiryDate: String,
    $type: String!,
    $currency: String!,
    $limitedToTags: [String],
    $limitedToCollectiveIds: [Int],
    $limitedToHostCollectiveIds: [Int]
    ) {
    createPaymentMethod(
      amount: $amount,
      monthlyLimitPerMember: $monthlyLimitPerMember,
      CollectiveId: $CollectiveId,
      PaymentMethodId: $PaymentMethodId,
      description: $description,
      expiryDate: $expiryDate,
      type: $type,
      currency: $currency,
      limitedToTags: $limitedToTags,
      limitedToCollectiveIds: $limitedToCollectiveIds,
      limitedToHostCollectiveIds: $limitedToHostCollectiveIds
      ) {
      id
      name
      uuid
      collective {
        id
      }
      SourcePaymentMethodId
      initialBalance
      monthlyLimitPerMember
      expiryDate
      currency
      limitedToTags
      limitedToCollectiveIds
      limitedToHostCollectiveIds
    }
  }
`;

async function createVirtualCardThroughGraphQL(args, user) {
  const gqlResult = await utils.graphqlQuery(createPaymentMethodQuery, args, user);
  if (!get(gqlResult, 'data.createPaymentMethod')) {
    const error = gqlResult.errors ? gqlResult.errors[0] : Error('Graphql Query did not return a result');
    throw error;
  }
  const paymentMethod = gqlResult.data.createPaymentMethod;
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    CollectiveId: paymentMethod.collective.id,
    balance: paymentMethod.initialBalance,
    monthlyLimitPerMember: paymentMethod.monthlyLimitPerMember,
    currency: paymentMethod.currency,
    limitedToTags: paymentMethod.limitedToTags,
    limitedToCollectiveIds: paymentMethod.limitedToCollectiveIds,
    limitedToHostCollectiveIds: paymentMethod.limitedToHostCollectiveIds,
    code: paymentMethod.uuid.substring(0, 8),
    expiryDate: moment(new Date(paymentMethod.expiryDate)).format(),
    redeemUrl: `${config.host.website}/redeem?code=${paymentMethod.uuid.substring(0, 8)}`,
  };
}

/**
 * Creates a virtual card given (at least) an amount, a currency and a
 * CollectiveId(if the logged in user is and admin of the collective).
 */
export function createVirtualCard(req, res) {
  const args = pick(req.body, [
    'description',
    'CollectiveId',
    'PaymentMethodId',
    'amount',
    'monthlyLimitPerMember',
    'currency',
    'expiryDate',
    'limitedToTags',
    'limitedToCollectiveIds',
    'limitedToHostCollectiveIds',
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

/**
 * Creates a payment method given (at least) an amount, , a currency and a
 * CollectiveId(if the logged in user is and admin of the collective).
 * PS.: Only supports creating Virtual cards at the moment.
 */
export function createPaymentMethod(req, res, next) {
  // We only support creation of "virtualcard" payment methods
  if (get(req, 'body.type') && get(req, 'body.type') !== 'virtualcard') {
    throw Error(`Creation of payment methods with type ${get(req, 'body.type')} not Allowed`);
  }
  return createVirtualCard(req, res, next);
}
