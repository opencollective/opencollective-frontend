import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from 'graphql';
import GraphQLJSON from 'graphql-type-json';

import transferwise from '../../../paymentProviders/transferwise';

const RequiredBankInformation = new GraphQLObjectType({
  name: 'RequiredBankInformation',
  description: 'A list of required bank information inputs',
  fields: {
    fields: {
      args: {
        currency: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The 3 letter code identifying the currency you want to receive (ie: USD, EUR, BRL, GBP)',
        },
      },
      type: GraphQLJSON,
      async resolve({ host }, args) {
        return await transferwise.getRequiredBankInformation(host, args.currency);
      },
    },
    currencies: {
      type: GraphQLJSON,
      async resolve({ host }) {
        return await transferwise.getAvailableCurrencies(host);
      },
    },
  },
});

export default RequiredBankInformation;
