import { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList } from 'graphql';

import { Account, AccountFields } from '../interface/Account';
import { hostResolver } from '../../common/collective';
import { ConversationCollection } from '../collection/ConversationCollection';
import { TagStats } from './TagStats';
import models, { Op } from '../../../models';

export const Collective = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents a Collective account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'COLLECTIVE',
  fields: () => {
    return {
      ...AccountFields,
      balance: {
        description: 'Amount of money in cents in the currency of the collective currently available to spend',
        type: GraphQLInt,
        resolve(collective, _, req) {
          return req.loaders.Collective.balance.load(collective.id);
        },
      },
      host: {
        description: 'Get the host collective that is receiving the money on behalf of this collective',
        type: Account,
        resolve: hostResolver,
      },
      conversations: {
        type: ConversationCollection,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          tag: {
            type: GraphQLString,
            description: 'Only return conversations matching this tag',
          },
        },
        async resolve(collective, { limit, offset, tag }) {
          const query = { where: { CollectiveId: collective.id }, order: [['createdAt', 'DESC']] };
          if (limit) query.limit = limit;
          if (offset) query.offset = offset;
          if (tag) query.where.tags = { [Op.contains]: [tag] };
          const result = await models.Conversation.findAndCountAll(query);
          return { nodes: result.rows, total: result.count, limit, offset };
        },
      },
      conversationsTags: {
        type: new GraphQLList(TagStats),
        description: "Returns conversation's tags for collective sorted by popularity",
        args: {
          limit: { type: GraphQLInt, defaultValue: 30 },
        },
        async resolve(collective, _, { limit }) {
          return models.Conversation.getMostPopularTagsForCollective(collective.id, limit);
        },
      },
    };
  },
});
