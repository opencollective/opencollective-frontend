import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInterfaceType
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';

import status from '../constants/response_status';
import models from '../models';
import dataloaderSequelize from 'dataloader-sequelize';
dataloaderSequelize(models.Response);
dataloaderSequelize(models.Event);
dataloaderSequelize(models.Transaction);
dataloaderSequelize(models.Expense);
dataloaderSequelize(models.Donation);

// This breaks the tests for some reason (mocha test/usergroup.routes.test.js -g "successfully add a user to a group with a role")
// dataloaderSequelize(models.User);

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
      organization: {
        type: GraphQLString,
        resolve(user) {
          return user.organization
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
      },
      collectives: {
        type: new GraphQLList(CollectiveType),
        resolve(user) {
          return user.getCollectivesWithRoles();
        }
      },
      paymentMethods: {
        type: new GraphQLList(PaymentMethodType),
        resolve(user, args, req) {
          if (!req.remoteUser || req.remoteUser.id !== user.id) return [];
          return models.PaymentMethod.findAll({where: { UserId: user.id }});
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
      settings: {
        type: GraphQLJSON,
        resolve(collective) {
          return collective.settings || {};
        }
      },
      slug: {
        type: GraphQLString,
        resolve(collective) {
          return collective.slug;
        }
      },
      users: {
        type: new GraphQLList(UserType),
        resolve(collective, args, req) {
          return collective.getUsersForViewer(req.remoteUser);
        }
      },
      tiers: {
        type: new GraphQLList(TierType),
        resolve(collective) {
          return collective.getTiers();
        }
      },
      transactions: {
        type: new GraphQLList(TransactionInterfaceType),
        args: {
          type: { type: GraphQLString },
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(collective, args) {
          const query = {};
          if (args.type) query.where = { type: args.type };
          if (args.limit) query.limit = args.limit;
          if (args.offset) query.offset = args.offset;
          query.order = [ ['id', 'DESC'] ];
          return collective.getTransactions(query);
        }
      },
      role: {
        type: GraphQLString,
        resolve(collective, args, req) {
          return collective.role || collective.getRoleForUser(req.remoteUser);
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
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(collective, args) {
          const query = {};
          if (args.limit) query.limit = args.limit;
          if (args.offset) query.offset = args.offset;
          return collective.getEvents(query);
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

export const LocationType = new GraphQLObjectType({
  name: 'LocationType',
  description: 'Type for Location',
  fields: () => ({
    name: { type: GraphQLString },
    address: { type: GraphQLString },
    lat: { type: GraphQLFloat },
    long: { type: GraphQLFloat }
  })
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
        type: LocationType,
        description: 'Name, address, lat, long of the location.',
        resolve(event) {
          return event.location;
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
          return event.getTiers({ order: [['name', 'ASC']] });
        }
      },
      responses: {
        type: new GraphQLList(ResponseType),
        resolve(event) {
          return event.getResponses({
            where: { 
              confirmedAt: { $ne: null } 
            },
            order: [
              ['createdAt', 'DESC']
            ]
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
      slug: {
        type: GraphQLString,
        resolve(tier) {
          return tier.slug
        }
      },
      type: {
        type: GraphQLString,
        resolve(tier) {
          return tier.type
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
      interval: {
        type: GraphQLString,
        resolve(tier) {
          return tier.interval;
        }
      },
      maxQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.maxQuantity;
        }
      },
      maxQuantityPerUser: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.maxQuantityPerUser;
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
      goal: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.goal;
        }
      },
      totalAmount: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.totalAmount();
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
      collective: {
        type: CollectiveType,
        resolve(tier) {
          return tier.getGroup();
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
        resolve(response, args, req) {
          return response.getUserForViewer(req.remoteUser);
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
      createdAt: {
        type: GraphQLString,
        resolve(response) {
          return response.createdAt;
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

export const PaymentMethodType = new GraphQLObjectType({
  name: "PaymentMethodType",
  description: "Sanitized PaymentMethod Info (PaymentMethod model)",
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.id;
        }
      },
      service: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.service;
        }
      },
      brand: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.brand;
        }
      },
      funding: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.funding;
        }
      },
      country: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.country;
        }
      },
      identifier: { // last 4 digit of card number for Stripe
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.identifier;
        }
      },
      fullName: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.fullName;
        }
      },
      expMonth: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.expMonth;
        }
      },
      expYear: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.expYear;
        }
      }
    }
  }
});

export const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  description: "Subscription model",
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(s) {
          return s.id;
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(s) {
          return s.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(s) {
          return s.currency;
        }
      },
      interval: {
        type: GraphQLString,
        resolve(s) {
          return s.interval;
        }
      },
      isActive: {
        type: GraphQLBoolean,
        resolve(s) {
          return s.isActive;
        }
      }
    }
  }
});

export const TransactionInterfaceType = new GraphQLInterfaceType({
  name: "Transaction",
  description: "Transaction interface",
  resolveType: (transaction) => {
    switch (transaction.type) {
      case 'DONATION':
        return TransactionDonationType;
      case 'EXPENSE':
        return TransactionExpenseType;
      default:
        return null;
    }
  },
  fields: {
    id: { type: GraphQLInt },
    uuid: { type: GraphQLString },
    amount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    netAmountInGroupCurrency: { type: GraphQLInt },
    hostFeeInTxnCurrency: { type: GraphQLInt },
    platformFeeInTxnCurrency: { type: GraphQLInt },
    paymentProcessorFeeInTxnCurrency: { type: GraphQLInt },
    user: { type: UserType },
    host: { type: UserType },
    paymentMethod: { type: PaymentMethodType },
    collective: { type: CollectiveType },
    type: { type: GraphQLString },
    title: { type: GraphQLString },
    notes: { type: GraphQLString },
    createdAt: { type: GraphQLString }
  }
});

export const TransactionExpenseType = new GraphQLObjectType({
  name: 'Expense',
  description: 'Expense model',
  interfaces: [TransactionInterfaceType],
  fields: {
      id: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.id;
      }
    },
    uuid: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.uuid;
      }
    },
    type: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.type;
      }
    },
    amount: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.amount;
      }
    },
    currency: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.currency;
      }
    },
    txnCurrency: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.txnCurrency;
      }
    },
    txnCurrencyFxRate: {
      type: GraphQLFloat,
      resolve(transaction) {
        return transaction.txnCurrencyFxRate;
      }
    },
    hostFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.hostFeeInTxnCurrency;
      }
    },
    platformFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.platformFeeInTxnCurrency;
      }
    },
    paymentProcessorFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.paymentProcessorFeeInTxnCurrency;
      }
    },
    netAmountInGroupCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.netAmountInGroupCurrency;
      }
    },
    host: {
      type: UserType,
      resolve(transaction, args, req) {
        return transaction.getHostForViewer(req.remoteUser);
      }
    },
    user: {
      type: UserType,
      resolve(transaction, args, req) {
        return transaction.getUserForViewer(req.remoteUser);
      }
    },
    description: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.description;
      }
    },
    collective: {
      type: CollectiveType,
      resolve(transaction) {
        return transaction.getGroup();
      }
    },
    createdAt: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.createdAt;
      }
    },
    title: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.getExpense().then(expense => expense && expense.title);
      }
    },
    notes: {
      type: GraphQLString,
      resolve(transaction, args, req) {
        return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.notes);
      }
    },
    paymentMethod: {
      type: PaymentMethodType,
      resolve(transaction) {
        return transaction.getPaymentMethod().then(pm => pm || { service: 'manual' });
      }
    },
    category: {
      type: GraphQLString,
      resolve(transaction, args, req) {
        return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.category);
      }
    },
    attachment: {
      type: GraphQLString,
      resolve(transaction, args, req) {
        return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.attachment);
      }
    }
  }
});

export const TransactionDonationType = new GraphQLObjectType({
  name: 'Donation',
  description: 'Donation model',
  interfaces: [TransactionInterfaceType],
  fields: () => {
    return {
       id: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.id;
        }
      },
      uuid: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.uuid;
        }
      },
      type: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.type;
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.currency;
        }
      },
      txnCurrency: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.txnCurrency;
        }
      },
      txnCurrencyFxRate: {
        type: GraphQLFloat,
        resolve(transaction) {
          return transaction.txnCurrencyFxRate;
        }
      },
      hostFeeInTxnCurrency: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.hostFeeInTxnCurrency;
        }
      },
      platformFeeInTxnCurrency: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.platformFeeInTxnCurrency;
        }
      },
      paymentProcessorFeeInTxnCurrency: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.paymentProcessorFeeInTxnCurrency;
        }
      },
      netAmountInGroupCurrency: {
        type: GraphQLInt,
        resolve(transaction) {
          return transaction.netAmountInGroupCurrency;
        }
      },
      host: {
        type: UserType,
        resolve(transaction, args, req) {
          return transaction.getHostForViewer(req.remoteUser);
        }
      },
      user: {
        type: UserType,
        resolve(transaction, args, req) {
          return transaction.getUserForViewer(req.remoteUser);
        }
      },
      description: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.description;
        }
      },
      collective: {
        type: CollectiveType,
        resolve(transaction) {
          return transaction.getGroup();
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.createdAt;
        }
      },
      title: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.getDonation().then(donation => donation && donation.title);
        }
      },
      notes: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.getDonation().then(donation => donation && donation.notes);
        }
      },
      paymentMethod: {
        type: PaymentMethodType,
        resolve(transaction) {
          return transaction.getPaymentMethod().then(pm => pm || { service: 'manual' });
        }
      },
      response: {
        type: ResponseType,
        resolve(transaction) {
          return transaction.getDonation().then(donation => donation && donation.getResponse());
        }
      },
      subscription: {
        type: SubscriptionType,
        resolve(transaction) {
          return transaction.getDonation().then(donation => donation && donation.getSubscription());
        }
      }
    }
  }
});
