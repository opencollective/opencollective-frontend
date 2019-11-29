import { GraphQLList, GraphQLObjectType } from 'graphql';

import { Collection, CollectionFields } from '../interface/Collection';
import Conversation from '../object/Conversation';

const ConversationCollection = new GraphQLObjectType({
  name: 'ConversationCollection',
  interfaces: [Collection],
  description: 'A collection of "Conversations"',
  fields: () => {
    return {
      ...CollectionFields,
      nodes: {
        type: new GraphQLList(Conversation),
      },
    };
  },
});

export { ConversationCollection };
