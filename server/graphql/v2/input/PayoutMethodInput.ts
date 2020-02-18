import { GraphQLString, GraphQLInputObjectType, GraphQLBoolean } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import PayoutMethodType from '../enum/PayoutMethodType';

/**
 * An input for PayoutMethod that can be used for either editing or creating payout methods.
 */
const PayoutMethodInput = new GraphQLInputObjectType({
  name: 'PayoutMethodInput',
  fields: {
    id: { type: GraphQLString },
    data: { type: GraphQLJSON },
    name: { type: GraphQLString },
    isSaved: { type: GraphQLBoolean },
    type: { type: PayoutMethodType },
  },
});

export { PayoutMethodInput };
