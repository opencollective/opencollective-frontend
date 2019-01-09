import { GraphQLString } from 'graphql';

import { Transaction } from '../interface/Transaction';

import models from '../../../models';

import { idDecode } from '../identifiers';

import { NotFound } from '../../errors';

const TransactionQuery = {
  type: Transaction,
  args: {
    id: {
      type: GraphQLString,
      description: 'The public id identifying the transaction (ie: rvelja97-pkzqbgq7-bbzyx6wd-50o8n4rm)',
    },
  },
  async resolve(_, args) {
    let transaction;
    if (args.id) {
      const id = idDecode(args.id, 'transaction');
      transaction = await models.Transaction.findByPk(id);
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
