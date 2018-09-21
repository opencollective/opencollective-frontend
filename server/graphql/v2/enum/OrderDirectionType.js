import { GraphQLEnumType } from 'graphql';

export const OrderDirectionType = new GraphQLEnumType({
  name: 'OrderDirection',
  description:
    'Possible directions in which to order a list of items when provided an orderBy argument.',
  values: {
    ASC: {},
    DESC: {},
  },
});
