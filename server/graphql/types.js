import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import models from '../models';
import status from '../constants/response_status';

export const ResponseStatusType = new GraphQLEnumType({
  name: 'Responses',
  values: {
    PENDING: { value: status.PENDING },
    INTERESTED: { value: status.INTERESTED },
    YES: { value: status.YES },
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
          return user.name;
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
      twitterHandle: {
        type: GraphQLString,
        resolve(collective) {
          return collective.twitterHandle;
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
          .then(stripeAccount => stripeAccount && stripeAccount.stripePublishableKey)
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
          return event.endsAt
        }
      },
      timezone: {
        type: GraphQLString,
        resolve(event) {
          return event.timezone
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
          return event.getResponses({
            where: { 
              confirmedAt: { $ne: null } 
            }
          });
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
          // graphql doesn't like infinity value
          .then(availableQuantity => availableQuantity === Infinity ? 10000000 : availableQuantity);
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
          return tier.getResponses({
            where: { 
              confirmedAt: { $ne: null } 
            }
          });
        }
      }
    }
  }
});

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

