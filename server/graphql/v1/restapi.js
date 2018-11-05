import * as utils from './utils';
import { get } from 'lodash';

const allTransactionsQuery = `
query allTransactions($collectiveSlug: String!, $limit: Int, $offset: Int, $type: String, $includeVirtualCards: Boolean ) {
  allTransactions(collectiveSlug: $collectiveSlug, limit: $limit, offset: $offset, type: $type, includeVirtualCards: $includeVirtualCards) {
    id
    uuid
    type
    amount
    currency
    hostCurrency
    hostCurrencyFxRate
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    netAmountInCollectiveCurrency
    createdAt
    host {
      id
      slug
    }
    createdByUser {
      id
      email
    }
    fromCollective {
      id
      slug
      name
      image
    }
    collective {
      id
      slug
      name
      image
    }
    paymentMethod {
      id
      service
      name
    }
  }
}
`;

const getTransactionQuery = `
  query Transaction($uuid: String) {
    Transaction(uuid: $uuid) {
      id
      uuid
      type
      createdAt
      description
      amount      
      currency
      hostCurrency
      hostCurrencyFxRate
      netAmountInCollectiveCurrency
      hostFeeInHostCurrency
      platformFeeInHostCurrency
      paymentProcessorFeeInHostCurrency
      paymentMethod {
        id
        service
        name
      }
      fromCollective {
        id
        slug
        name
        image
      }
      collective {
        id
        slug
        name
        image
      }
      host {
        id
        slug
        name
        image
      }
      ... on Order {
        order {
          id
          status
          subscription {
            id
            interval
          }
        }
      }
    }
  }
`;

/**
 * Get array of all transactions of a collective given its slug
 */
export const getLatestTransactions = async (req, res) => {
  try {
    const args = req.query;
    args.collectiveSlug = get(req, 'params.collectiveSlug');
    const response = await utils.graphqlQuery(allTransactionsQuery, req.query);
    if (response.errors) {
      throw new Error(response.errors[0]);
    }
    const result = get(response, 'data.allTransactions', []);
    res.send({ result });
  } catch (error) {
    res.status(400).send({ error: error.toString() });
  }
};

/**
 * Get one transaction of a collective given its uuid
 */
export const getTransaction = async (req, res) => {
  try {
    const response = await utils.graphqlQuery(getTransactionQuery, {
      uuid: req.params.uuid,
    });
    if (response.errors) {
      throw new Error(response.errors[0]);
    }
    const result = get(response, 'data.Transaction');
    res.send({ result });
  } catch (error) {
    res.status(400).send({ error: error.toString() });
  }
};
