import { GraphQLInt, GraphQLString, GraphQLList, GraphQLObjectType } from 'graphql';

import { OrderStatus } from '../enum/OrderStatus';
import { OrderCollection } from '../collection/OrderCollection';

import { idEncode } from '../identifiers';

import models, { Op } from '../../../models';

export const Tier = new GraphQLObjectType({
  name: 'Tier',
  description: 'Tier model',
  fields: () => {
    return {
      // _internal_id: {
      //   type: GraphQLInt,
      //   resolve(member) {
      //     return member.id;
      //   },
      // },
      id: {
        type: GraphQLString,
        resolve(tier) {
          return idEncode(tier.id, 'tier');
        },
      },
      slug: {
        type: GraphQLString,
        resolve(tier) {
          return tier.slug;
        },
      },
      name: {
        type: GraphQLString,
        resolve(tier) {
          return tier.slug;
        },
      },
      description: {
        type: GraphQLString,
        resolve(tier) {
          return tier.description;
        },
      },
      orders: {
        description: 'Get all orders',
        type: OrderCollection,
        args: {
          limit: { type: GraphQLInt, defaultValue: 100 },
          offset: { type: GraphQLInt, defaultValue: 0 },
          status: { type: new GraphQLList(OrderStatus) },
        },
        async resolve(tier, args) {
          const where = { TierId: tier.id };

          if (args.status && args.status.length > 0) {
            where.status = {
              [Op.in]: args.status,
            };
          }

          const result = await models.Order.findAndCountAll({ where, limit: args.limit, offset: args.offset });

          return { limit: args.limit, offset: args.offset, ...result };
        },
      },
    };
  },
});
