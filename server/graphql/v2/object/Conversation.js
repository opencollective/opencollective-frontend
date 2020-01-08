import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLInt } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import models, { Op } from '../../../models';
import { Account } from '../interface/Account';
import { CommentCollection } from '../collection/CommentCollection';
import { Comment } from './Comment';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers';
import { AccountCollection } from '../collection/AccountCollection';

const Conversation = new GraphQLObjectType({
  name: 'Conversation',
  description: 'A conversation thread',
  fields: () => {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: getIdEncodeResolver(IDENTIFIER_TYPES.CONVERSATION),
      },
      slug: { type: new GraphQLNonNull(GraphQLString) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      updatedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      tags: { type: new GraphQLList(GraphQLString) },
      summary: { type: new GraphQLNonNull(GraphQLString) },
      collective: {
        type: Account,
        resolve(conversation, args, req) {
          return req.loaders.Collective.byId.load(conversation.CollectiveId);
        },
      },
      fromCollective: {
        type: Account,
        resolve(conversation, args, req) {
          return req.loaders.Collective.byId.load(conversation.FromCollectiveId);
        },
      },
      body: {
        type: Comment,
        description: 'The root comment / starter for this conversation',
        resolve(conversation) {
          return models.Comment.findByPk(conversation.RootCommentId);
        },
      },
      comments: {
        type: CommentCollection,
        description: "List the comments for this conversation. Not backed by a loader, don't use this in lists.",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
        },
        async resolve(conversation, _, { limit, offset }) {
          const where = { ConversationId: conversation.id, id: { [Op.not]: conversation.RootCommentId } };
          const order = [['createdAt', 'ASC']];
          const query = { where, order };

          if (limit) {
            query.limit = limit;
          }
          if (offset) {
            query.offset = offset;
          }

          const result = await models.Comment.findAndCountAll(query);
          return { nodes: result.rows, totalCount: result.count, limit, offset };
        },
      },
      followers: {
        type: AccountCollection,
        args: {
          limit: { type: GraphQLInt, defaultValue: 10 },
          offset: { type: GraphQLInt, defaultValue: 0 },
        },
        async resolve(conversation, { offset, limit }, req) {
          const followers = await req.loaders.Conversation.followers.load(conversation.id);
          return {
            nodes: followers.slice(offset, offset + limit),
            totalCount: followers.length,
            offset,
            limit,
          };
        },
      },
      stats: {
        type: new GraphQLObjectType({
          name: 'ConversationStats',
          fields: {
            id: {
              type: new GraphQLNonNull(GraphQLString),
              resolve: getIdEncodeResolver(IDENTIFIER_TYPES.CONVERSATION),
            },
            commentsCount: {
              type: GraphQLInt,
              description: 'Total number of comments for this conversation',
              resolve(conversation, _, req) {
                return req.loaders.Conversation.commentsCount.load(conversation.id);
              },
            },
          },
        }),
        resolve(conversation) {
          return conversation;
        },
      },
    };
  },
});

export default Conversation;
