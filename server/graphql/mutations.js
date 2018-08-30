import { createCollective, editCollective, deleteCollective, approveCollective } from './mutations/collectives';
import { createOrder, cancelSubscription, updateSubscription, refundTransaction, addFundsToOrg } from './mutations/orders';
import { createMember, removeMember } from './mutations/members';
import { editTiers } from './mutations/tiers';
import { editConnectedAccount } from './mutations/connectedAccounts';
import { createExpense, editExpense, updateExpenseStatus, payExpense, deleteExpense } from './mutations/expenses';
import * as updateMutations from './mutations/updates';
import * as commentMutations from './mutations/comments';

import statuses from '../constants/expense_status';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  OrderType,
  TierType,
  MemberType,
  ExpenseType,
  UpdateType,
  CommentType,
  ConnectedAccountType,
  PaymentMethodType,
} from './types';

import {
  CollectiveInterfaceType
} from './CollectiveInterface';

import {
  TransactionInterfaceType,
} from './TransactionInterface';

import {
  CollectiveInputType,
  CollectiveAttributesInputType,
  OrderInputType,
  TierInputType,
  ExpenseInputType,
  UpdateInputType,
  UpdateAttributesInputType,
  CommentInputType,
  CommentAttributesInputType,
  ConnectedAccountInputType,
  PaymentMethodInputType
} from './inputTypes';

const mutations = {
  createCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
      return createCollective(_, args, req);
    }
  },
  editCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) }
    },
    resolve(_, args, req) {
      return editCollective(_, args, req);
    }
  },
  deleteCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)}
    },
    resolve(_, args, req) {
      return deleteCollective(_, args, req);
    }
  },
  approveCollective: {
    type: CollectiveInterfaceType,
    description: "Approve a collective",
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return approveCollective(req.remoteUser, args.id);
    }
  },
  editConnectedAccount: {
    type: ConnectedAccountType,
    args: {
      connectedAccount: { type: new GraphQLNonNull(ConnectedAccountInputType) }
    },
    resolve(_, args, req) {
      return editConnectedAccount(req.remoteUser, args.connectedAccount);
    }
  },
  approveExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.APPROVED);
    }
  },
  rejectExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.REJECTED);
    }
  },
  payExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      fee: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return payExpense(req.remoteUser, args.id, args.fee);
    }
  },
  createExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) }
    },
    resolve(_, args, req) {
      return createExpense(req.remoteUser, args.expense);
    }
  },
  editExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) }
    },
    resolve(_, args, req) {
      return editExpense(req.remoteUser, args.expense);
    }
  },
  deleteExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args, req) {
      return deleteExpense(req.remoteUser, args.id);
    }
  },
  editTiers: {
    type: new GraphQLList(TierType),
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      tiers: { type: new GraphQLList(TierInputType) }
    },
    resolve(_, args, req) {
      return editTiers(_, args, req);
    }
  },
  createMember: {
    type: MemberType,
    args: {
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve(_, args, req) {
      return createMember(_, args, req);
    }
  },
  removeMember: {
    type: MemberType,
    args: {
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve(_, args, req) {
      return removeMember(_, args, req);
    }
  },
  createOrder: {
    type: OrderType,
    args: {
      order: {
        type: new GraphQLNonNull(OrderInputType)
      }
    },
    resolve(_, args, req) {
      return createOrder(args.order, req.loaders, req.remoteUser);
    }
  },
  createUpdate: {
    type: UpdateType,
    args: {
      update: {
        type: new GraphQLNonNull(UpdateInputType)
      }
    },
    resolve(_, args, req) {
      return updateMutations.createUpdate(_, args, req);
    }
  },
  editUpdate: {
    type: UpdateType,
    args: {
      update: {
        type: new GraphQLNonNull(UpdateAttributesInputType)
      }
    },
    resolve(_, args, req) {
      return updateMutations.editUpdate(_, args, req);
    }
  },
  publishUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args, req) {
      return updateMutations.publishUpdate(_, args, req);
    }
  },
  unpublishUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args, req) {
      return updateMutations.unpublishUpdate(_, args, req);
    }
  },
  deleteUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args, req) {
      return updateMutations.deleteUpdate(_, args, req);
    }
  },
  createComment: {
    type: CommentType,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentInputType)
      }
    },
    resolve(_, args, req) {
      return commentMutations.createComment(_, args, req);
    }
  },
  editComment: {
    type: CommentType,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentAttributesInputType)
      }
    },
    resolve(_, args, req) {
      return commentMutations.editComment(_, args, req);
    }
  },
  deleteComment: {
    type: CommentType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args, req) {
      return commentMutations.deleteComment(_, args, req);
    }
  },
  cancelSubscription: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)}
    },
    resolve(_, args, req) {
      return cancelSubscription(req.remoteUser, args.id);
    }
  },
  updateSubscription: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt)},
      paymentMethod: { type: PaymentMethodInputType},
      amount: { type: GraphQLInt }
    },
    async resolve(_, args, req) {
      return await updateSubscription(req.remoteUser, args)
    }
  },
  refundTransaction: {
    type: TransactionInterfaceType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    async resolve(_, args, req) {
      return await refundTransaction(_, args, req);
    }
  },
  addFundsToOrg: {
    type: PaymentMethodType,
    args: {
      totalAmount: { type: new GraphQLNonNull(GraphQLInt) },
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      HostCollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      description: { type: GraphQLString },
      PaymentMethodId: { type: GraphQLInt },
    },
    resolve: async (_, args, req) => addFundsToOrg(args, req.remoteUser),
  }
};

export default mutations;
