import AccountQuery from './AccountQuery';
import CollectiveQuery from './CollectiveQuery';

import TransactionQuery from './TransactionQuery';
import TransactionsQuery from './TransactionsQuery';

import { Account } from '../interface/Account';

import models from '../../../models';

const query = {
  account: AccountQuery,
  collective: CollectiveQuery,
  transaction: TransactionQuery,
  transactions: TransactionsQuery,
  loggedInAccount: {
    type: Account,
    resolve(_, args, req) {
      return models.Collective.findById(req.remoteUser.CollectiveId);
    },
  },
};

export default query;
