import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from 'graphql';
import GraphQLJSON from 'graphql-type-json';

import transferwise from '../../../paymentProviders/transferwise';

const blackListedCurrencies = [
  'BRL', // Businesses customers are not supported yet.
];

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
      async resolve(_, args, req) {
        return await transferwise.getRequiredBankInformation(req.collective, args.currency);
      },
    },
    currencies: {
      type: GraphQLJSON,
      async resolve(_, __, req) {
        const pairs = await transferwise.getAvailableCurrencies(req.collective);
        const source = pairs?.sourceCurrencies?.find(sc => sc.currencyCode === req.collective.currency);
        if (source?.targetCurrencies) {
          return source.targetCurrencies
            .filter(c => !blackListedCurrencies.includes(c.currencyCode))
            .map(c => c.currencyCode);
        }
        return null;
      },
    },
  },
});

export default RequiredBankInformation;
