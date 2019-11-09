import { GraphQLNonNull, GraphQLString } from 'graphql';

import { Expense } from '../object/Expense';
import models from '../../../models';
import { getDecodedId } from '../identifiers';

const ExpenseQuery = {
  type: Expense,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Public expense identifier',
    },
  },
  async resolve(_, { id }) {
    const decodedId = getDecodedId(id);
    return models.Expense.findByPk(decodedId);
  },
};

export default ExpenseQuery;
