import { GraphQLString, GraphQLObjectType } from 'graphql';
// import { GraphQLInt } from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { Account } from '../interface/Account';
import { Amount } from '../object/Amount';
import { Tier } from '../object/Tier';

import { OrderFrequency, OrderStatus } from '../enum';

import { idEncode } from '../identifiers';

export const Order = new GraphQLObjectType({
  name: 'Order',
  description: 'Order model',
  fields: () => {
    return {
      // _internal_id: {
      //   type: GraphQLInt,
      //   resolve(order) {
      //     return order.id;
      //   },
      // },
      id: {
        type: GraphQLString,
        resolve(order) {
          return idEncode(order.id, 'order');
        },
      },
      description: {
        type: GraphQLString,
        resolve(order) {
          return order.description;
        },
      },
      amount: {
        type: Amount,
        resolve(order) {
          return { value: order.totalAmount };
        },
      },
      status: {
        type: OrderStatus,
        resolve(order) {
          return order.status;
        },
      },
      frequency: {
        type: OrderFrequency,
        async resolve(order) {
          const subscription = await order.getSubscription();
          if (!subscription) {
            return 'ONETIME';
          }
          if (subscription.interval === 'month') {
            return 'MONTHLY';
          } else if (subscription.interval === 'year') {
            return 'YEARLY';
          }
        },
      },
      tier: {
        type: Tier,
        resolve(order, args, req) {
          if (order.tier) {
            return order.tier;
          }
          if (order.TierId) {
            return req.loaders.Tier.byId.load(order.TierId);
          }
        },
      },
      fromAccount: {
        type: Account,
        resolve(order) {
          return order.getFromCollective();
        },
      },
      toAccount: {
        type: Account,
        resolve(order) {
          return order.getCollective();
        },
      },
      createdAt: {
        type: GraphQLDateTime,
        resolve(order) {
          return order.createdAt;
        },
      },
      updatedAt: {
        type: GraphQLDateTime,
        resolve(order) {
          return order.updatedAt;
        },
      },
      totalDonations: {
        type: Amount,
        description: 'UNSUPPORTED: Total amount donated between collectives',
        async resolve(order, args, req) {
          const value = await req.loaders.Transaction.totalAmountDonatedFromTo.load({
            FromCollectiveId: order.FromCollectiveId,
            CollectiveId: order.CollectiveId,
          });
          return { value };
        },
      },
    };
  },
});
