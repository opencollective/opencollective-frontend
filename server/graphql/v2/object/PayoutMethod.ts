import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLBoolean } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers';
import PayoutMethodType from '../enum/PayoutMethodType';

const PayoutMethod = new GraphQLObjectType({
  name: 'PayoutMethod',
  description: 'A payout method',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: getIdEncodeResolver(IDENTIFIER_TYPES.PAYOUT_METHOD),
    },
    type: {
      type: PayoutMethodType,
    },
    name: {
      type: GraphQLString,
    },
    isSaved: {
      type: GraphQLBoolean,
    },
    data: {
      type: GraphQLJSON,
    },
  },
});

export default PayoutMethod;
