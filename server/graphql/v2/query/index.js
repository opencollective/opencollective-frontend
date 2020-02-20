import AccountQuery from './AccountQuery';
import CollectiveQuery from './CollectiveQuery';
import ExpenseQuery from './ExpenseQuery';
import ConversationQuery from './ConversationQuery';

// import TransactionQuery from './TransactionQuery';
// import TransactionsQuery from './TransactionsQuery';

import { Account } from '../interface/Account';

import models from '../../../models';

const query = {
  account: AccountQuery,
  collective: CollectiveQuery,
  conversation: ConversationQuery,
  expense: ExpenseQuery,
  // transaction: TransactionQuery,
  // transactions: TransactionsQuery,
  loggedInAccount: {
    type: Account,
    resolve(_, args, req) {
      if (!req.remoteUser) {
        return null;
      } else {
        return models.Collective.findByPk(req.remoteUser.CollectiveId);
      }
    },
  },
};

export default query;
