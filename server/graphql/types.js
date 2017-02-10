import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
  GraphQLError
} from 'graphql';

import { Kind } from 'graphql/language';

import models from '../models';

export const ResponseStatusType = new GraphQLEnumType({
  name: 'Responses',
  values: {
    PENDING: { value: 'PENDING' },
    INTERESTED: { value: 'INTERESTED' },
    YES: { value: 'YES' },
    NO: { value: 'NO' }
  }
});

const nonZeroPositiveIntValue = (value) => value > 0 ? value : null;

const NonZeroPositiveIntType = new GraphQLScalarType({
  name: 'nonZeroPositiveInt',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return nonZeroPositiveIntValue(parseInt(ast.value, 10));
    }
    throw new GraphQLError('Query error: must be an Integer greater than 0', [ast]);
  }
});

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
        throw new GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast]);
      }

      // Regex taken from: http://stackoverflow.com/a/46181/761555
      var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      if(!re.test(ast.value)) {
        throw new GraphQLError('Query error: Not a valid Email', [ast]);
      }

      return ast.value;
    }
});

export const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'This represents a User',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(user) {
          return user.id;
        }
      },
      firstName: {
        type: GraphQLString,
        resolve(user) {
          return user.firstName;
        }
      },
      lastName: {
        type: GraphQLString,
        resolve(user) {
          return user.lastName;
        }
      },
      name: {
        type: GraphQLString,
        resolve(user) {
          return `${user.firstName} ${user.lastName}`;
        }
      },
      avatar: {
        type: GraphQLString,
        resolve(user) {
          return user.avatar;
        }
      },
      username: {
        type: GraphQLString,
        resolve(user) {
          return user.username;
        }
      },
      email: {
        type: GraphQLString,
        resolve(user) {
          return user.email;
        }
      },
      description: {
        type: GraphQLString,
        resolve(user) {
          return user.description
        }
      },
      isOrganization: {
        type: GraphQLBoolean,
        resolve(user) {
          return user.isOrganization;
        }
      },
      twitterHandle: {
        type: GraphQLString,
        resolve(user) {
          return user.twitterHandle;
        }
      },
      billingAddress: {
        type: GraphQLString,
        resolve(user) {
          return user.billingAddress;
        }
      },
      website: {
        type: GraphQLString,
        resolve(user) {
          return user.website;
        }
      },
      paypalEmail: {
        type: GraphQLString,
        resolve(user) {
          return user.paypalEmail;
        }
      }
    }
  }
});

export const CollectiveType = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents a Collective',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.id;
        }
      },
      name: {
        type: GraphQLString,
        resolve(collective) {
          return collective.name;
        }
      },
      description: {
        type: GraphQLString,
        resolve(collective) {
          return collective.description;
        }
      },
      longDescription: {
        type: GraphQLString,
        resolve(collective) {
          return collective.longDescription;
        }
      },
      mission: {
        type: GraphQLString,
        resolve(collective) {
          return collective.mission;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(collective) {
          return collective.currency;
        }
      },
      logo: {
        type: GraphQLString,
        resolve(collective) {
          return collective.logo;
        }
      },
      backgroundImage: {
        type: GraphQLString,
        resolve(collective) {
          return collective.backgroundImage;
        }
      },
      slug: {
        type: GraphQLString,
        resolve(collective) {
          return collective.slug;
        }
      },
      events: {
        type: new GraphQLList(EventType),
        resolve(collective) {
          return collective.getEvents();
        }
      },
      stripePublishableKey: {
        type: GraphQLString,
        resolve(collective) {
          return collective.getStripeAccount()
          .then(stripeAccount => stripeAccount && stripeAccount.stripePublishablekey)
        }
      }
    }
  }
});

export const EventType = new GraphQLObjectType({
  name: 'Event',
  description: 'This represents an Event',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(event) {
          return event.id;
        }
      },
      name: {
        type: GraphQLString,
        resolve(event) {
          return event.name
        }
      },
      description: {
        type: GraphQLString,
        resolve(event) {
          return event.description
        }
      },
      backgroundImage: {
        type: GraphQLString,
        resolve(event) {
          return event.backgroundImage;
        }
      },
      createdByUser: {
        type: UserType,
        resolve(event) {
          return models.User.findById(event.createdByUserId)
        }
      },
      collective: {
        type: CollectiveType,
        resolve(event) {
          return event.getGroup();
        }
      },
      slug: {
        type: GraphQLString,
        resolve(event) {
          return event.slug;
        }
      },
      location: {
        type: GraphQLString,
        description: 'Name of the location. Ex: Puck Fair restaurant',
        resolve(event) {
          return event.locationName;
        }
      },
      address: {
        type: GraphQLString,
        description: 'Ex: 525 Broadway, NY 10012',
        resolve(event) {
          return event.address;
        }
      },
      lat: {
        type: GraphQLFloat,
        resolve(event) {
          return event.geoLocationLatLong ? event.geoLocationLatLong.coordinates[0] : null;
        }
      },
      long: {
        type: GraphQLFloat,
        resolve(event) {
          return event.geoLocationLatLong ? event.geoLocationLatLong.coordinates[1] : null;
        }
      },
      startsAt: {
        type: GraphQLString,
        resolve(event) {
          return event.startsAt
        }
      },
      endsAt: {
        type: GraphQLString,
        resolve(event) {
          return event.startsAt
        }
      },
      maxAmount: {
        type: GraphQLInt,
        resolve(event) {
          return event.maxAmount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(event) {
          return event.currency;
        }
      },
      maxQuantity: {
        type: GraphQLInt,
        resolve(event) {
          return event.maxQuantity;
        }
      },
      tiers: {
        type: new GraphQLList(TierType),
        resolve(event) {
          return event.getTiers();
        }
      },
      responses: {
        type: new GraphQLList(ResponseType),
        resolve(event) {
          return event.getResponses();
        }
      }

    }
  }
});

export const TierType = new GraphQLObjectType({
  name: 'Tier',
  description: 'This represents an Tier',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.id;
        }
      },
      name: {
        type: GraphQLString,
        resolve(tier) {
          return tier.name
        }
      },
      description: {
        type: GraphQLString,
        resolve(tier) {
          return tier.description
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(tier) {
          return tier.currency;
        }
      },
      maxQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.maxQuantity;
        }
      },
      availableQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.availableQuantity()
        }
      },
      password: {
        type: GraphQLString,
        resolve(tier) {
          return tier.password
        }
      },
      startsAt: {
        type: GraphQLString,
        resolve(tier) {
          return tier.startsAt
        }
      },
      endsAt: {
        type: GraphQLString,
        resolve(tier) {
          return tier.startsAt
        }
      },
      event: {
        type: EventType,
        resolve(tier) {
          return tier.getEvent();
        }
      },
      responses: {
        type: new GraphQLList(ResponseType),
        resolve(tier) {
          return tier.getResponses();
        }
      }
    }
  }
});

export const CardInputType = new GraphQLInputObjectType({
  name: 'CardInputType',
  description: 'Input type for Card',
  fields: () => ({
    token: { type: new GraphQLNonNull(GraphQLString)},
    expMonth: { type: new GraphQLNonNull(GraphQLInt)},
    expYear: { type: new GraphQLNonNull(GraphQLInt)},
    cvc: { type: new GraphQLNonNull(GraphQLInt)}
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
      avatar: { type: GraphQLString },
      username: { type: GraphQLString },
      description: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      website: { type: GraphQLString },
      paypalEmail: { type: GraphQLString },
      card: { type: CardInputType }
  })
});

export const GroupInputType = new GraphQLInputObjectType({
  name: 'GroupInputType',
  description: 'Input type for GroupType',
  fields: () => ({
    id:   { type: GraphQLInt },
    slug: { type: new GraphQLNonNull(GraphQLString) }
  })
});

export const EventAttributesInputType = new GraphQLInputObjectType({
  name: 'EventAttributes',
  description: 'Input type for attributes of EventInputType',
  fields: () => ({
    id: { type: GraphQLInt },
    slug: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    locationString: { type: GraphQLString },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
    maxAmount: { type: GraphQLInt },
    currency: { type: GraphQLString},
  })
});

export const EventInputType = new GraphQLInputObjectType({
  name: 'EventInputType',
  description: 'Input type for EventType',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    locationString: { type: GraphQLString },
    startsAt: { type: new GraphQLNonNull(GraphQLString) },
    endsAt: { type: GraphQLString },
    maxAmount: { type: new GraphQLNonNull(GraphQLString) },
    currency: { type: GraphQLString },
    quantity: { type: GraphQLInt },
    tiers: { type: new GraphQLList(TierInputType) },
    group: { type: new GraphQLNonNull(GroupInputType) },
  })
});

export const TierInputType = new GraphQLInputObjectType({
  name: 'TierInputType',
  description: 'Input type for TierType',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    amount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    quantity: { type: GraphQLInt },
    password: { type: GraphQLString },
    startsAt: { type: GraphQLString },
    endsAt: { type: GraphQLString },
  })
});

export const ResponseInputType = new GraphQLInputObjectType({
  name: 'ResponseInputType',
  description: 'Input type for ResponseType',
  fields: () => ({
    id: { type: GraphQLInt },
    quantity: { type: new GraphQLNonNull(NonZeroPositiveIntType) },
    user: { type: new GraphQLNonNull(UserInputType) },
    group: { type: new GraphQLNonNull(GroupInputType) },
    tier: { type: new GraphQLNonNull(TierInputType) },
    event: { type: new GraphQLNonNull(EventAttributesInputType) },
    status: { type: new GraphQLNonNull(GraphQLString) }
  })
})

export const ResponseType = new GraphQLObjectType({
  name: 'Response',
  description: 'This is a Response',
  fields: () => {
    return {
       id: {
        type: GraphQLInt,
        resolve(response) {
          return response.id;
        }
      },
      quantity: {
        type: GraphQLInt,
        resolve(response) {
          return response.quantity;
        }
      },
      user: {
        type: UserType,
        resolve(response) {
          return response.getUser();
        }
      },
      description: {
        type: GraphQLString,
        resolve(response) {
          return response.description;
        }
      },
      collective: {
        type: CollectiveType,
        resolve(response) {
          return response.getGroup();
        }
      },
      tier: {
        type: TierType,
        resolve(response) {
          return response.getTier();
        }
      },
      event: {
        type: EventType,
        resolve(response) {
          return response.getEvent();
        }
      },
      confirmedAt: {
        type: GraphQLString,
        resolve(response) {
          return response.confirmedAt;
        }
      },
      status: {
        type: ResponseStatusType,
        resolve(response) {
          return response.status;
        }
      }
    }
  }
});

