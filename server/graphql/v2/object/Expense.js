import { GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import models, { Op } from '../../../models';

import { setContextPermission, PERMISSION_TYPE } from '../../common/context-permissions';
import { canViewExpensePrivateInfo } from '../../common/expenses';
import { CommentCollection } from '../collection/CommentCollection';
import { Account } from '../interface/Account';
import { CollectionArgs } from '../interface/Collection';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers';

import { ChronologicalOrder } from '../input/ChronologicalOrder';

const Expense = new GraphQLObjectType({
  name: 'Expense',
  description: 'This represents an Expense',
  fields: () => {
    return {
      id: {
        type: GraphQLString,
        resolve: getIdEncodeResolver(IDENTIFIER_TYPES.EXPENSE),
      },
      legacyId: {
        type: GraphQLInt,
        description: 'Legacy ID as returned by API V1. Avoid relying on this field as it may be removed in the future.',
        resolve(expense) {
          return expense.id;
        },
      },
      comments: {
        type: CommentCollection,
        args: {
          ...CollectionArgs,
          orderBy: {
            type: ChronologicalOrder,
            defaultValue: ChronologicalOrder.defaultValue,
          },
        },
        async resolve(expense, { limit, offset, orderBy }) {
          const { count, rows } = await models.Comment.findAndCountAll({
            where: {
              ExpenseId: { [Op.eq]: expense.id },
            },
            order: [[orderBy.field, orderBy.direction]],
            offset,
            limit,
          });
          return {
            offset,
            limit,
            totalCount: count,
            nodes: rows,
          };
        },
      },
      payee: {
        type: Account,
        description: 'The account being paid by this expense',
        async resolve(expense, _, req) {
          // Set the permissions for account's fields
          const canSeePrivateInfo = (await canViewExpensePrivateInfo(expense, req)).userLocation;
          setContextPermission(req, PERMISSION_TYPE.SEE_ACCOUNT_LOCATION, expense.FromCollectiveId, canSeePrivateInfo);

          // Return fromCollective
          return req.loaders.Collective.byId.load(expense.FromCollectiveId);
        },
      },
      invoiceInfo: {
        type: GraphQLString,
        description: 'Information to display on the invoice. Only visible to user and admins.',
        async resolve(expense, _, req) {
          const expensePermissions = await canViewExpensePrivateInfo(expense, req);
          if (expensePermissions.invoiceInfo) {
            return expense.invoiceInfo;
          }
        },
      },
    };
  },
});

export { Expense };
