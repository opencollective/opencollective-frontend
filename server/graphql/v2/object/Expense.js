import { GraphQLString, GraphQLObjectType } from 'graphql';
import models, { Op } from '../../../models';

import { CommentCollection } from '../collection/CommentCollection';
import { CollectionArgs } from '../interface/Collection';
import { getIdEncodeResolver } from '../identifiers';

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
        },
        async resolve(expense, { limit, offset }) {
          const { count, rows } = await models.Comment.findAndCountAll({
            where: {
              ExpenseId: { [Op.eq]: expense.id },
            },
            order: [['createdAt', 'DESC']],
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
