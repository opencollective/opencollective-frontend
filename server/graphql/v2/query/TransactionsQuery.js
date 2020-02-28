import { GraphQLInt } from 'graphql';

import { TransactionCollection } from '../collection/TransactionCollection';
import { TransactionType } from '../enum/TransactionType';

import { ChronologicalOrderInput } from '../input/ChronologicalOrderInput';

import models from '../../../models';

const TransactionsQuery = {
  type: TransactionCollection,
  args: {
    type: {
      type: TransactionType,
      description: 'The transaction type (DEBIT or CREDIT)',
    },
    limit: {
      type: GraphQLInt,
      description: 'The number of results to fetch (default 10, max 1000)',
      defaultValue: 10,
    },
    offset: {
      type: GraphQLInt,
      description: 'The offset to use to fetch',
      defaultValue: 0,
    },
    orderBy: {
      type: ChronologicalOrderInput,
      description: 'The order of results',
      defaultValue: ChronologicalOrderInput.defaultValue,
    },
  },
  async resolve(_, args) {
    const where = {};

    if (args.type) {
      where.type = args.type;
    }

    return models.Transaction.findAndCountAll({
      where,
      limit: args.limit,
      offset: args.offset,
      order: [[args.orderBy.field, args.orderBy.direction]],
    });
  },
};

export default TransactionsQuery;
