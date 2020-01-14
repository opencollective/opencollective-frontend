import { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLBoolean } from 'graphql';
import Conversation from '../object/Conversation';
import { createConversation, editConversation } from '../../common/conversations';
import { idDecode, IDENTIFIER_TYPES } from '../identifiers';
import { Unauthorized } from '../../errors';
import models from '../../../models';

const conversationMutations = {
  createConversation: {
    type: Conversation,
    description: 'Create a conversation',
    args: {
      title: {
        type: new GraphQLNonNull(GraphQLString),
        description: "Conversation's title",
      },
      html: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The body of the conversation initial comment',
      },
      CollectiveId: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'ID of the Collective where the conversation will be created',
      },
      tags: {
        type: new GraphQLList(GraphQLString),
        description: 'A list of tags for this conversation',
      },
    },
    resolve(_, args, req) {
      args.CollectiveId = parseInt(idDecode(args.CollectiveId, 'collective'));
      return createConversation(req.remoteUser, args);
    },
  },
  editConversation: {
    type: Conversation,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: "Conversation's id",
      },
      title: {
        type: new GraphQLNonNull(GraphQLString),
        description: "Conversation's title",
      },
      tags: {
        type: new GraphQLList(GraphQLString),
        description: 'A list of tags for this conversation',
      },
    },
    resolve(_, args, req) {
      args.id = parseInt(idDecode(args.id, IDENTIFIER_TYPES.CONVERSATION));
      return editConversation(req.remoteUser, args);
    },
  },
  followConversation: {
    type: GraphQLBoolean,
    description: 'Returns true if user is following, false otherwise. Must be authenticated.',
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: "Conversation's id",
      },
      isActive: {
        type: GraphQLBoolean,
        description: 'Set this to false to unfollow the conversation',
        defaultValue: true,
      },
    },
    async resolve(_, { id, isActive }, req) {
      const conversationId = parseInt(idDecode(id, IDENTIFIER_TYPES.CONVERSATION));

      if (!req.remoteUser) {
        throw new Unauthorized();
      } else if (isActive) {
        await models.ConversationFollower.follow(req.remoteUser.id, conversationId);
        return true;
      } else {
        await models.ConversationFollower.unfollow(req.remoteUser.id, conversationId);
        return false;
      }
    },
  },
};

export default conversationMutations;
