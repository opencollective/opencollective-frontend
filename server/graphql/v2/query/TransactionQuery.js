import { GraphQLInt } from 'graphql';

import { Transaction } from '../interface/Transaction';

import models from '../../../models';

import { NotFound } from '../../errors';

const TransactionQuery = {
  type: Transaction,
  args: {
    id: { type: GraphQLInt },
  },
  async resolve(_, args) {
    let transaction;
    if (args.id) {
      transaction = await models.Transaction.findById(args.id);
    } else {
      return new Error('Please provide an id');
    }
    if (!transaction) {
      throw new NotFound({ message: 'Transaction Not Found' });
    }
    return transaction;
  },
};

export default TransactionQuery;
