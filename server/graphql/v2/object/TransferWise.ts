import { GraphQLNonNull, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLInt } from 'graphql';

import { TransferWiseCurrency } from '../enum/Currency';
import transferwise from '../../../paymentProviders/transferwise';

const TransferWiseFieldGroupValuesAllowed = new GraphQLObjectType({
  name: 'TransferWiseFieldVatvkluesAllowed',
  fields: {
    key: { type: GraphQLString },
    name: { type: GraphQLString },
  },
});

const TransferWiseFieldGroup = new GraphQLObjectType({
  name: 'TransferWiseFieldGroup',
  fields: {
    key: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    required: { type: GraphQLBoolean },
    displayFormat: { type: GraphQLString },
    example: { type: GraphQLString },
    minLength: { type: GraphQLInt },
    maxLength: { type: GraphQLInt },
    validationRegexp: { type: GraphQLString },
    validationAsync: { type: GraphQLString },
    valuesAllowed: { type: new GraphQLList(TransferWiseFieldGroupValuesAllowed) },
  },
});

const TransferWiseField = new GraphQLObjectType({
  name: 'TransferWiseField',
  fields: {
    name: { type: GraphQLString },
    group: { type: new GraphQLList(TransferWiseFieldGroup) },
  },
});

const TransferWiseRequiredField = new GraphQLObjectType({
  name: 'TransferWiseRequiredField',
  fields: {
    type: { type: GraphQLString },
    title: { type: GraphQLString },
    fields: { type: new GraphQLList(TransferWiseField) },
  },
});

export const TransferWise = new GraphQLObjectType({
  name: 'TransferWise',
  description: 'TransferWise related properties for bank transfer.',
  fields: {
    requiredFields: {
      args: {
        currency: {
          type: new GraphQLNonNull(TransferWiseCurrency),
          description: 'The 3 letter code identifying the currency you want to receive (ie: USD, EUR, BRL, GBP)',
        },
      },
      type: new GraphQLList(TransferWiseRequiredField),
      async resolve(host, args) {
        if (host) {
          return await transferwise.getRequiredBankInformation(host, args.currency);
        } else {
          return null;
        }
      },
    },
    availableCurrencies: {
      type: new GraphQLList(TransferWiseCurrency),
      async resolve(host) {
        if (host) {
          const availableCurrencies = await transferwise.getAvailableCurrencies(host);
          return availableCurrencies.map(c => c.code);
        } else {
          return null;
        }
      },
    },
  },
});
