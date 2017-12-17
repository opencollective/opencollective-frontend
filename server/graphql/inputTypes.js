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

import GraphQLJSON from 'graphql-type-json';
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
    data: { type: GraphQLJSON },
    name: { type: GraphQLString },
    primary: { type: GraphQLBoolean },
    monthlyLimitPerMember: { type: GraphQLInt },
    currency: { type: GraphQLString },
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
      company: { type: GraphQLString },
      image: { type: GraphQLString },
      username: { type: GraphQLString },
      description: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      website: { type: GraphQLString },
      paypalEmail: { type: GraphQLString }
  })
});

export const MemberInputType = new GraphQLInputObjectType({
  name: 'MemberInputType',
  description: 'Input type for MemberType',
  fields: () => ({
      id: { type: GraphQLInt },
      member: { type: CollectiveAttributesInputType },
      collective: { type: CollectiveAttributesInputType },
      role: { type: GraphQLString },
      description: { type: GraphQLString }
  })
});

export const CollectiveInputType = new GraphQLInputObjectType({
  name: 'CollectiveInputType',
  description: 'Input type for CollectiveType',
  fields: () => ({
    id:   { type: GraphQLInt },
    slug: { type: GraphQLString },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    website: { type: GraphQLString },
    twitterHandle: { type: GraphQLString },
    description: { type: GraphQLString },
    longDescription: { type: GraphQLString },
    location: { type: LocationInputType},
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    timezone: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    image: { type: GraphQLString },
    backgroundImage: { type: GraphQLString },
    tiers: { type: new GraphQLList(TierInputType) },
    members: { type: new GraphQLList(MemberInputType) },
    paymentMethods: { type: new GraphQLList(PaymentMethodInputType) },
    HostCollectiveId: { type: GraphQLInt },
    ParentCollectiveId: { type: GraphQLInt },
    // not very logical to have this here. Might need some refactoring. Used to add/edit members and to create a new user on a new order
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString }
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
    company: { type: GraphQLString },
    firstName: { type: GraphQLString }, // for Collective type USER
    lastName: { type: GraphQLString }, // for Collective type USER
    email: { type: GraphQLString }, // for Collective type USER
    description: { type: GraphQLString },
    longDescription: { type: GraphQLString },
    website: { type: GraphQLString },
    twitterHandle: { type: GraphQLString },
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
    hostFeePercent: { type: GraphQLInt },
    platformFeePercent: { type: GraphQLInt },
    interval: { type: GraphQLString },
    description: { type: GraphQLString },
    publicMessage: { type: GraphQLString },
    privateMessage: { type: GraphQLString },
    paymentMethod: { type: PaymentMethodInputType },
    matchingFund: { type: GraphQLString, description: "The first part of the UUID of the PaymentMethod that can be used to match the donation" },
    referral: { type: CollectiveAttributesInputType, description: "The referral collective" },
    user: { type: UserInputType },
    fromCollective: { type: CollectiveAttributesInputType },
    collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
    tier: { type: TierInputType }
  })
});

export const ExpenseInputType = new GraphQLInputObjectType({
  name: 'ExpenseInputType',
  description: 'Input type for ExpenseType',
  fields: () => {
    return {
      id: { type: GraphQLInt },
      amount: { type: GraphQLInt },
      currency: { type: GraphQLString },
      createdAt: { type: GraphQLString },
      incurredAt: { type: GraphQLString },
      description: { type: GraphQLString },
      category: { type: GraphQLString },
      status: { type: GraphQLString },
      payoutMethod: { type: GraphQLString },
      privateMessage: { type: GraphQLString },
      attachment: { type: GraphQLString },
      user: { type: UserInputType },
      collective: { type: CollectiveAttributesInputType }
    }
  }
});
