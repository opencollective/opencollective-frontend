import { GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import models, { Op } from '../../../models';

import { setContextPermission, PERMISSION_TYPE } from '../../common/context-permissions';
import { canSeeExpenseInvoiceInfo, canSeeExpensePayeeLocation } from '../../common/expenses';
import { CommentCollection } from '../collection/CommentCollection';
import { Account } from '../interface/Account';
import { CollectionArgs } from '../interface/Collection';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers';

import { ChronologicalOrderInput } from '../input/ChronologicalOrderInput';

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
            type: ChronologicalOrderInput,
            defaultValue: ChronologicalOrderInput.defaultValue,
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
          const canSeeLocation = await canSeeExpensePayeeLocation(req, expense);
          setContextPermission(req, PERMISSION_TYPE.SEE_ACCOUNT_LOCATION, expense.FromCollectiveId, canSeeLocation);

          // Return fromCollective
          return req.loaders.Collective.byId.load(expense.FromCollectiveId);
        },
      },
      invoiceInfo: {
        type: GraphQLString,
        description: 'Information to display on the invoice. Only visible to user and admins.',
        async resolve(expense, _, req) {
          if (await canSeeExpenseInvoiceInfo(req, expense)) {
            return expense.invoiceInfo;
          }
        },
      },
    };
  },
});

export { Expense };
