import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
  GraphQLError,
  GraphQLEnumType,
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';
import { Kind } from 'graphql/language';
import { IsoDateString, DateString } from './types';

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
  },
});

export const PaymentMethodInputType = new GraphQLInputObjectType({
  name: 'PaymentMethodInputType',
  description: 'Input type for PaymentMethod (paypal/stripe)',
  fields: () => ({
    id: { type: GraphQLInt },
    uuid: { type: GraphQLString }, // used to fetch an existing payment method
    token: { type: GraphQLString },
    service: { type: GraphQLString },
    type: {
      type: GraphQLString,
      description: 'creditcard, virtualcard, prepaid, manual...',
    },
    customerId: { type: GraphQLString },
    data: { type: GraphQLJSON },
    name: { type: GraphQLString },
    primary: { type: GraphQLBoolean },
    monthlyLimitPerMember: { type: GraphQLInt },
    currency: { type: GraphQLString },
    save: { type: GraphQLBoolean },
  }),
});

export const PaymentMethodDataVirtualCardInputType = new GraphQLInputObjectType({
  name: 'PaymentMethodDataVirtualCardInputType',
  description: 'Input for virtual card (meta)data',
  fields: () => ({
    email: { type: GraphQLString, description: 'The email virtual card is generated for' },
  }),
});

const CustomFieldType = new GraphQLEnumType({
  name: 'CustomFieldType',
  description: 'Type of custom field',
  values: {
    number: {},
    text: {},
    email: {},
    date: {},
    radio: {},
    url: {},
  },
});

export const CustomFieldsInputType = new GraphQLInputObjectType({
  name: 'CustomFieldsInputType',
  description: 'Input for custom fields for order',
  fields: () => ({
    type: { type: CustomFieldType },
    name: { type: GraphQLString },
    label: { type: GraphQLString },
    required: { type: GraphQLBoolean },
  }),
});

export const StripeCreditCardDataInputType = new GraphQLInputObjectType({
  name: 'StripeCreditCardDataInputType',
  description: 'Input for stripe credit card data',
  fields: () => ({
    fullName: { type: GraphQLString },
    expMonth: { type: GraphQLInt },
    expYear: { type: GraphQLInt },
    brand: { type: GraphQLString },
    country: { type: GraphQLString },
    funding: { type: GraphQLString },
    zip: { type: GraphQLString },
  }),
});

export const UserInputType = new GraphQLInputObjectType({
  name: 'UserInputType',
  description: 'Input type for UserType',
  fields: () => ({
    id: { type: GraphQLInt },
    email: { type: EmailType },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    image: { type: GraphQLString },
    username: { type: GraphQLString },
    description: { type: GraphQLString },
    twitterHandle: { type: GraphQLString },
    githubHandle: { type: GraphQLString },
    website: { type: GraphQLString },
    paypalEmail: { type: GraphQLString },
    newsletterOptIn: { type: GraphQLBoolean },
  }),
});

export const MemberInputType = new GraphQLInputObjectType({
  name: 'MemberInputType',
  description: 'Input type for MemberType',
  fields: () => ({
    id: { type: GraphQLInt },
    member: { type: CollectiveAttributesInputType },
    collective: { type: CollectiveAttributesInputType },
    role: { type: GraphQLString },
    description: { type: GraphQLString },
    since: { type: DateString },
  }),
});

export const NotificationInputType = new GraphQLInputObjectType({
  name: 'NotificationInputType',
  description: 'Input type for NotificationType',
  fields: () => ({
    id: { type: GraphQLInt },
    type: { type: new GraphQLNonNull(GraphQLString) },
    webhookUrl: { type: GraphQLString },
  }),
});

export const CollectiveInputType = new GraphQLInputObjectType({
  name: 'CollectiveInputType',
  description: 'Input type for CollectiveType',
  fields: () => ({
    id: { type: GraphQLInt },
    slug: { type: GraphQLString },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    website: { type: GraphQLString },
    twitterHandle: { type: GraphQLString },
    githubHandle: { type: GraphQLString },
    description: { type: GraphQLString },
    longDescription: { type: GraphQLString },
    expensePolicy: { type: GraphQLString },
    location: { type: LocationInputType },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    timezone: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    image: { type: GraphQLString },
    backgroundImage: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
    tiers: { type: new GraphQLList(TierInputType) },
    settings: { type: GraphQLJSON },
    data: { type: GraphQLJSON },
    members: { type: new GraphQLList(MemberInputType) },
    notifications: { type: new GraphQLList(NotificationInputType) },
    HostCollectiveId: { type: GraphQLInt },
    hostFeePercent: { type: GraphQLInt },
    ParentCollectiveId: { type: GraphQLInt },
    // not very logical to have this here. Might need some refactoring. Used to add/edit members and to create a new user on a new order
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    isIncognito: { type: GraphQLBoolean },
  }),
});

export const ConnectedAccountInputType = new GraphQLInputObjectType({
  name: 'ConnectedAccountInputType',
  description: 'Input type for ConnectedAccountInputType',
  fields: () => ({
    id: { type: GraphQLInt },
    settings: { type: GraphQLJSON },
  }),
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
    expensePolicy: { type: GraphQLString },
    website: { type: GraphQLString },
    twitterHandle: { type: GraphQLString },
    githubHandle: { type: GraphQLString },
    location: { type: LocationInputType },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    timezone: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    settings: { type: GraphQLJSON },
    isIncognito: { type: GraphQLBoolean },
    tags: { type: new GraphQLList(GraphQLString) },
  }),
});

export const LocationInputType = new GraphQLInputObjectType({
  name: 'LocationInputType',
  description: 'Input type for Location',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'A short name for the location (eg. Google Headquarters)',
    },
    address: {
      type: GraphQLString,
      description: 'Postal address without country (eg. 12 opensource avenue, 7500 Paris)',
    },
    country: {
      type: GraphQLString,
      description: 'Two letters country code (eg. FR, BE...etc)',
    },
    lat: {
      type: GraphQLFloat,
      description: 'Latitude',
    },
    long: {
      type: GraphQLFloat,
      description: 'Longitude',
    },
  }),
});

export const TierInputType = new GraphQLInputObjectType({
  name: 'TierInputType',
  description: 'Input type for TierType',
  fields: () => ({
    id: { type: GraphQLInt },
    type: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    longDescription: {
      type: GraphQLString,
      description: 'A long, html-formatted description.',
    },
    videoUrl: {
      type: GraphQLString,
      description: 'Link to a video (YouTube, Vimeo).',
    },
    amount: {
      type: GraphQLInt,
      description: 'amount in the lowest unit of the currency of the host (ie. in cents)',
    },
    button: {
      type: GraphQLString,
      description: 'Button text',
    },
    currency: { type: GraphQLString },
    presets: { type: new GraphQLList(GraphQLInt) },
    interval: { type: GraphQLString },
    maxQuantity: { type: GraphQLInt },
    minimumAmount: { type: GraphQLInt },
    amountType: { type: GraphQLString },
    maxQuantityPerUser: { type: GraphQLInt },
    goal: {
      type: GraphQLInt,
      description: 'amount that you are trying to raise with this tier',
    },
    password: { type: GraphQLString },
    customFields: { type: new GraphQLList(CustomFieldsInputType) },
    startsAt: {
      type: GraphQLString,
      description: 'Start of the campaign',
    },
    endsAt: {
      type: GraphQLString,
      description: 'End of the campaign',
    },
  }),
});

export const OrderInputType = new GraphQLInputObjectType({
  name: 'OrderInputType',
  description: 'Input type for OrderType',
  fields: () => ({
    id: { type: GraphQLInt },
    quantity: {
      type: GraphQLInt,
      defaultValue: 1,
    },
    totalAmount: { type: GraphQLInt },
    hostFeePercent: { type: GraphQLInt },
    platformFeePercent: { type: GraphQLInt },
    currency: { type: GraphQLString },
    interval: { type: GraphQLString },
    description: { type: GraphQLString },
    publicMessage: { type: GraphQLString },
    privateMessage: { type: GraphQLString },
    paymentMethod: { type: PaymentMethodInputType },
    matchingFund: {
      type: GraphQLString,
      description: 'The first part of the UUID of the PaymentMethod that can be used to match the donation',
      deprecationReason: '2019-08-19: Matching funds are not supported anymore',
    },
    referral: {
      type: CollectiveAttributesInputType,
      description: 'The referral collective',
      deprecationReason: '2019-08-22: Referals are not supported anymore',
    },
    user: { type: UserInputType },
    fromCollective: { type: CollectiveAttributesInputType },
    collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
    tier: { type: TierInputType },
    customData: { type: GraphQLJSON },
    recaptchaToken: { type: GraphQLString },
    // For taxes
    taxAmount: {
      type: GraphQLInt,
      description: 'The amount of taxes that were included in totalAmount',
      defaultValue: 0,
    },
    countryISO: {
      type: GraphQLString,
      description: 'User country, to know which tax applies',
    },
    taxIDNumber: {
      type: GraphQLString,
      description: 'User tax ID number',
    },
  }),
});

export const ConfirmOrderInputType = new GraphQLInputObjectType({
  name: 'ConfirmOrderInputType',
  description: 'Input type for ConfirmOrderType',
  fields: () => ({
    id: { type: GraphQLInt },
  }),
});

export const CommentInputType = new GraphQLInputObjectType({
  name: 'CommentInputType',
  description: 'Input type for CommentType',
  fields: () => ({
    id: { type: GraphQLInt },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    FromCollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
    CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
    ExpenseId: { type: GraphQLInt },
    UpdateId: { type: GraphQLInt },
  }),
});

export const CommentAttributesInputType = new GraphQLInputObjectType({
  name: 'CommentAttributesInputType',
  description: 'Input type for CommentType',
  fields: () => ({
    id: { type: GraphQLInt },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    FromCollectiveId: { type: GraphQLInt },
    CollectiveId: { type: GraphQLInt },
    ExpenseId: { type: GraphQLInt },
    UpdateId: { type: GraphQLInt },
  }),
});

export const UpdateInputType = new GraphQLInputObjectType({
  name: 'UpdateInputType',
  description: 'Input type for UpdateType',
  fields: () => ({
    id: { type: GraphQLInt },
    views: { type: GraphQLInt },
    slug: { type: GraphQLString },
    title: { type: GraphQLString },
    image: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    fromCollective: { type: CollectiveAttributesInputType },
    collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
    tier: { type: TierInputType },
  }),
});

export const UpdateAttributesInputType = new GraphQLInputObjectType({
  name: 'UpdateAttributesInputType',
  description: 'Input type for UpdateType',
  fields: () => ({
    id: { type: GraphQLInt },
    views: { type: GraphQLInt },
    slug: { type: GraphQLString },
    title: { type: GraphQLString },
    image: { type: GraphQLString },
    isPrivate: { type: GraphQLBoolean },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    fromCollective: { type: CollectiveAttributesInputType },
    tier: { type: TierInputType },
  }),
});

export const ExpenseInputType = new GraphQLInputObjectType({
  name: 'ExpenseInputType',
  description: 'Input type for ExpenseType',
  fields: () => {
    return {
      id: { type: GraphQLInt },
      amount: { type: GraphQLInt },
      currency: { type: GraphQLString },
      createdAt: { type: DateString },
      incurredAt: { type: DateString },
      description: { type: GraphQLString },
      category: { type: GraphQLString },
      status: { type: GraphQLString },
      type: { type: GraphQLString },
      payoutMethod: {
        type: GraphQLString,
        description: 'Can be paypal, donation, manual, other',
      },
      privateMessage: { type: GraphQLString },
      attachment: { type: GraphQLString },
      user: { type: UserInputType },
      collective: { type: CollectiveAttributesInputType },
    };
  },
});

export const InvoiceInputType = new GraphQLInputObjectType({
  name: 'InvoiceInputType',
  description: 'Input dates and collectives for Invoice',
  fields: () => {
    return {
      dateFrom: { type: IsoDateString },
      dateTo: { type: IsoDateString },
      collectiveSlug: { type: GraphQLString },
      fromCollectiveSlug: { type: GraphQLString },
    };
  },
});
