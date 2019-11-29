import { GraphQLList, GraphQLObjectType } from 'graphql';

import { Comment } from '../object/Comment';
import { Collection, CollectionFields } from '../interface/Collection';

const CommentCollection = new GraphQLObjectType({
  name: 'CommentCollection',
  interfaces: [Collection],
  description: 'A collection of "Comments"',
  fields: () => {
    return {
      ...CollectionFields,
      nodes: {
        type: new GraphQLList(Comment),
      },
    };
  },
});

export { CommentCollection };
