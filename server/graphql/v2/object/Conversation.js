import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLInt } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import slugify from 'limax';
import models, { Op } from '../../../models';
import { Account } from '../interface/Account';
import { CommentCollection } from '../collection/CommentCollection';
import { Comment } from './Comment';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers';

const Conversation = new GraphQLObjectType({
  name: 'Conversation',
  description: 'A conversation thread',
  fields: () => {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: getIdEncodeResolver(IDENTIFIER_TYPES.CONVERSATION),
      },
      slug: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(conversation) {
          return slugify(conversation.title) || 'conversation';
        },
      },
      title: { type: new GraphQLNonNull(GraphQLString) },
      createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      updatedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      tags: { type: new GraphQLList(GraphQLString) },
      summary: { type: new GraphQLNonNull(GraphQLString) },
      collective: {
        type: Account,
        resolve(conversation, args, req) {
          return req.loaders.collective.findById.load(conversation.CollectiveId);
        },
      },
      fromCollective: {
        type: Account,
        resolve(conversation, args, req) {
          return req.loaders.collective.findById.load(conversation.FromCollectiveId);
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
        description: '',
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
        },
        async resolve(conversation, _, { limit, offset }) {
          const where = { ConversationId: conversation.id, id: { [Op.not]: conversation.RootCommentId } };
          const order = [['createdAt', 'ASC']];
          const query = { where, order };

          if (limit) query.limit = limit;
          if (offset) query.offset = offset;

          const result = await models.Comment.findAndCountAll(query);
          return { nodes: result.rows, totalCount: result.count, limit, offset };
        },
      },
    };
  },
});

export default Conversation;
