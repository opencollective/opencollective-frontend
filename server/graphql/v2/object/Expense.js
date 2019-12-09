import { GraphQLString, GraphQLObjectType } from 'graphql';
import models, { Op } from '../../../models';

import { CommentCollection } from '../collection/CommentCollection';
import { CollectionArgs } from '../interface/Collection';
import { getIdEncodeResolver } from '../identifiers';

import { ChronologicalOrder } from '../input/ChronologicalOrder';

const Expense = new GraphQLObjectType({
  name: 'Expense',
  description: 'This represents an Expense',
  fields: () => {
    return {
      id: {
        type: GraphQLString,
        resolve: getIdEncodeResolver('expense'),
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
    };
  },
});

export { Expense };
