import { GraphQLNonNull, GraphQLString, GraphQLList } from 'graphql';
import Conversation from '../object/Conversation';
import { createConversation, editConversation } from '../../common/conversations';
import { idDecode, IDENTIFIER_TYPES } from '../identifiers';

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
      args.CollectiveId = idDecode(args.CollectiveId, 'collective');
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
    },
    resolve(_, args, req) {
      args.id = parseInt(idDecode(args.id, IDENTIFIER_TYPES.CONVERSATION));
      return editConversation(req.remoteUser, args);
    },
  },
};

export default conversationMutations;
