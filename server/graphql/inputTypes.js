import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
  GraphQLError
} from 'graphql';

import { Kind } from 'graphql/language';

const EmailType = new GraphQLScalarType({
    name: 'Email',
    serialize: value => {
      return value;
    },
    parseValue: value => {
      return value;
    },
    parseLiteral: ast => {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError(`Query error: Can only parse strings got a: ${ast.kind}`);
      }

      // Regex taken from: http://stackoverflow.com/a/46181/761555
      const re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      if (!re.test(ast.value)) {
        throw new GraphQLError(`Query error: Not a valid Email ${[ast]}`);
      }

      return ast.value;
    }
});

export const PaymentMethodInputType = new GraphQLInputObjectType({
  name: 'PaymentMethodInputType',
  description: 'Input type for PaymentMethod (paypal/stripe)',
  fields: () => ({
    id: { type: GraphQLInt },
    uuid: { type: GraphQLString }, // used to fetch an existing payment method
    token: { type: GraphQLString },
    service: { type: GraphQLString },
    customerId: { type: GraphQLString },
    brand: { type: GraphQLString },
    funding: { type: GraphQLString },
    country: { type: GraphQLString },
    fullName: { type: GraphQLString },
    expMonth: { type: GraphQLInt },
    expYear: { type: GraphQLInt },
    identifier: { type: GraphQLString },
    save: { type: GraphQLBoolean }
  })
});

export const UserInputType = new GraphQLInputObjectType({
  name: 'UserInputType',
  description: 'Input type for UserType',
  fields: () => ({
      id: { type: GraphQLInt },
      email: { type: new GraphQLNonNull(EmailType) },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      name: { type: GraphQLString },
      image: { type: GraphQLString },
      username: { type: GraphQLString },
      description: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      website: { type: GraphQLString },
      paypalEmail: { type: GraphQLString }
  })
});

export const UserAttributesInputType = new GraphQLInputObjectType({
  name: 'UserAttributesInputType',
  description: 'Input type for UserType',
  fields: () => ({
      id: { type: GraphQLInt },
      email: { type: EmailType },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      name: { type: GraphQLString },
      image: { type: GraphQLString },
      username: { type: GraphQLString },
      description: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      website: { type: GraphQLString },
      paypalEmail: { type: GraphQLString }
  })
});

export const CollectiveInputType = new GraphQLInputObjectType({
  name: 'CollectiveInputType',
  description: 'Input type for CollectiveType',
  fields: () => ({
    id:   { type: GraphQLInt },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    longDescription: { type: GraphQLString },
    location: { type: LocationInputType},
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    timezone: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    tiers: { type: new GraphQLList(TierInputType) },
    ParentCollectiveId: { type: GraphQLInt }
  })
});

export const CollectiveAttributesInputType = new GraphQLInputObjectType({
  name: 'CollectiveAttributesInputType',
  description: 'Input type for attributes of CollectiveInputType',
  fields: () => ({
    id: { type: GraphQLInt },
    slug: { type: GraphQLString },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    longDescription: { type: GraphQLString },
    location: { type: LocationInputType },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    timezone: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString}
  })
});

export const LocationInputType = new GraphQLInputObjectType({
  name: 'LocationInputType',
  description: 'Input type for Location',
  fields: () => ({
    name: { type: GraphQLString },
    address: { type: GraphQLString },
    lat: { type: GraphQLFloat },
    long: { type: GraphQLFloat }
  })
});

export const TierInputType = new GraphQLInputObjectType({
  name: 'TierInputType',
  description: 'Input type for TierType',
  fields: () => ({
    id: { type: GraphQLInt },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    amount: { type: GraphQLInt },
    interval: { type: GraphQLString },
    currency: { type: GraphQLString },
    maxQuantity: { type: GraphQLInt },
    maxQuantityPerUser: { type: GraphQLInt },
    goal: { type: GraphQLInt },
    password: { type: GraphQLString },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
  })
});

export const OrderInputType = new GraphQLInputObjectType({
  name: 'OrderInputType',
  description: 'Input type for OrderType',
  fields: () => ({
    quantity: { type: GraphQLInt },
    totalAmount: { type: GraphQLInt },
    interval: { type: GraphQLString },
    description: { type: GraphQLString },
    publicMessage: { type: GraphQLString },
    privateMessage: { type: GraphQLString },
    user: { type: new GraphQLNonNull(UserAttributesInputType) },
    paymentMethod: { type: PaymentMethodInputType },
    fromCollective: { type: CollectiveAttributesInputType },
    toCollective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
    tier: { type: TierInputType }
  })
});